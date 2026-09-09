/**
 * @file ServiceManager.ts
 * @description Central Service Management runtime coordinating system services and health.
 */

import type { EventBus } from '../events/index.js';
import { BaseSystemService as KernelService } from '../kernel/index.js';
import { SERVICE_EVENTS } from './ServiceEvents.js';
import { ServiceDependencyResolver } from './ServiceDependency.js';
import { ServiceRegistry } from './ServiceRegistry.js';
import { MissingServiceDependencyError } from './ServiceError.js';
import type {
  ServiceHealthInfo,
  ServiceManagerConfig,
  SystemService,
} from './types.js';

export class ServiceManager extends KernelService {
  public override readonly name = 'services';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = ['event-bus'];

  private readonly _registry = new ServiceRegistry();
  private _eventBus?: EventBus;
  private readonly _config: ServiceManagerConfig;

  constructor(config?: ServiceManagerConfig) {
    super();
    this._config = config ?? {};
    this._eventBus = config?.eventBus;
  }

  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  public registerService(service: SystemService): void {
    this._registry.register(service);
    this._emitEvent(SERVICE_EVENTS.SERVICE_REGISTERED, {
      serviceId: service.id,
      name: service.name,
      timestamp: Date.now(),
    });
  }

  public async unregisterService(serviceId: string): Promise<void> {
    const service = this._registry.getOrThrow(serviceId);
    if (service.getStatus() === 'RUNNING') {
      await this.stopService(serviceId);
    }
    this._registry.unregister(serviceId);
    this._emitEvent(SERVICE_EVENTS.SERVICE_UNREGISTERED, {
      serviceId,
      timestamp: Date.now(),
    });
  }

  public getService(serviceId: string): SystemService | undefined {
    return this._registry.get(serviceId);
  }

  public hasService(serviceId: string): boolean {
    return this._registry.has(serviceId);
  }

  public getServices(): SystemService[] {
    return this._registry.getAll();
  }

  public getRunningServices(): SystemService[] {
    return this._registry.getRunning();
  }

  public getFailedServices(): SystemService[] {
    return this._registry.getFailed();
  }

  public async startService(serviceId: string): Promise<void> {
    const service = this._registry.getOrThrow(serviceId);
    if (service.getStatus() === 'RUNNING') return;

    // Start dependencies if needed
    for (const depId of service.dependencies ?? []) {
      const dep = this._registry.get(depId);
      if (!dep) {
        throw new MissingServiceDependencyError(serviceId, depId);
      }
      if (dep.getStatus() !== 'RUNNING') {
        await this.startService(depId);
      }
    }

    this._emitEvent(SERVICE_EVENTS.SERVICE_STARTING, {
      serviceId,
      timestamp: Date.now(),
    });

    try {
      if (service.initialize && service.getStatus() === 'REGISTERED') {
        await service.initialize();
      }
      if (service.start) {
        await service.start();
      }
      this._emitEvent(SERVICE_EVENTS.SERVICE_STARTED, {
        serviceId,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this._emitEvent(SERVICE_EVENTS.SERVICE_FAILED, {
        serviceId,
        error: err.message ?? String(err),
        timestamp: Date.now(),
      });
      throw err;
    }
  }

  public async stopService(serviceId: string): Promise<void> {
    const service = this._registry.getOrThrow(serviceId);
    if (service.getStatus() === 'STOPPED') return;

    // Stop dependents first to preserve dependency safety
    for (const other of this._registry.getAll()) {
      if (other.id !== serviceId && other.dependencies?.includes(serviceId) && other.getStatus() === 'RUNNING') {
        await this.stopService(other.id);
      }
    }

    this._emitEvent(SERVICE_EVENTS.SERVICE_STOPPING, {
      serviceId,
      timestamp: Date.now(),
    });

    try {
      if (service.stop) {
        await service.stop();
      }
      this._emitEvent(SERVICE_EVENTS.SERVICE_STOPPED, {
        serviceId,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this._emitEvent(SERVICE_EVENTS.SERVICE_FAILED, {
        serviceId,
        error: err.message ?? String(err),
        timestamp: Date.now(),
      });
      throw err;
    }
  }

  public async restartService(serviceId: string): Promise<void> {
    await this.stopService(serviceId);
    await this.startService(serviceId);
    this._emitEvent(SERVICE_EVENTS.SERVICE_RESTARTED, {
      serviceId,
      timestamp: Date.now(),
    });
  }

  public async pauseService(serviceId: string): Promise<void> {
    const service = this._registry.getOrThrow(serviceId);
    if (service.pause) {
      await service.pause();
      this._emitEvent(SERVICE_EVENTS.SERVICE_PAUSED, {
        serviceId,
        timestamp: Date.now(),
      });
    }
  }

  public async resumeService(serviceId: string): Promise<void> {
    const service = this._registry.getOrThrow(serviceId);
    if (service.resume) {
      await service.resume();
      this._emitEvent(SERVICE_EVENTS.SERVICE_RESUMED, {
        serviceId,
        timestamp: Date.now(),
      });
    }
  }

  public async startAll(): Promise<void> {
    const ordered = ServiceDependencyResolver.resolveStartupOrder(this._registry.getAll());
    for (const service of ordered) {
      if (service.autoStart !== false && service.getStatus() !== 'RUNNING') {
        try {
          await this.startService(service.id);
        } catch {
          // Do not crash the entire system if an optional service fails to start
        }
      }
    }
  }

  public async stopAll(): Promise<void> {
    const ordered = ServiceDependencyResolver.resolveShutdownOrder(this._registry.getAll());
    for (const service of ordered) {
      if (service.getStatus() === 'RUNNING' || service.getStatus() === 'PAUSED') {
        try {
          await this.stopService(service.id);
        } catch {
          // Best effort stop
        }
      }
    }
  }

  public async checkServiceHealth(serviceId: string): Promise<ServiceHealthInfo> {
    const service = this._registry.getOrThrow(serviceId);
    const health = await service.getHealth();
    this._emitEvent(SERVICE_EVENTS.SERVICE_HEALTH_CHANGED, {
      serviceId,
      status: health.status,
      timestamp: Date.now(),
    });
    return health;
  }

  public async checkAllHealth(): Promise<Record<string, ServiceHealthInfo>> {
    const result: Record<string, ServiceHealthInfo> = {};
    for (const s of this._registry.getAll()) {
      result[s.id] = await s.getHealth();
    }
    return result;
  }

  protected override async onStart(): Promise<void> {
    if (this._config.autoStartRegistered) {
      await this.startAll();
    }
  }

  protected override async onStop(): Promise<void> {
    await this.stopAll();
  }

  private _emitEvent(event: string, payload: Record<string, unknown>): void {
    if (this._eventBus) {
      this._eventBus.emit(event as any, payload as any);
    }
  }
}
