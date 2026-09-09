/**
 * @file Kernel.ts
 * @description Central runtime and service orchestration engine for WebOS.
 */

import {
  type KernelConfig,
  type KernelLogger,
  resolveKernelConfig,
} from './KernelConfig.js';
import {
  InvalidKernelStateError,
  KernelTimeoutError,
  ServiceInitializationError,
  ServiceShutdownError,
  ServiceStartupError,
} from './KernelError.js';
import { KernelState } from './KernelState.js';
import type { SystemService } from './Service.js';
import { ServiceDependencyResolver } from './ServiceDependency.js';
import { ServiceRegistry } from './ServiceRegistry.js';
import type {
  KernelEvent,
  KernelEventListener,
  KernelEventType,
  KernelStateSnapshot,
  KernelStatus,
} from './types.js';

/**
 * The WebOS Kernel coordinates core operating system services, manages their
 * lifecycles according to dependency order, handles failures gracefully with rollbacks,
 * and emits lifecycle events.
 */
export class Kernel {
  private readonly _config: Required<Omit<KernelConfig, 'logger'>> & { logger?: KernelLogger };
  private readonly _state: KernelState;
  private readonly _registry: ServiceRegistry;
  private readonly _listeners: Map<KernelEventType, Set<KernelEventListener>>;

  /**
   * Initializes a new WebOS Kernel instance.
   *
   * @param config - Optional configuration settings.
   */
  constructor(config?: KernelConfig) {
    this._config = resolveKernelConfig(config);
    this._state = new KernelState();
    this._registry = new ServiceRegistry();
    this._listeners = new Map();
  }

  /**
   * Returns a snapshot of the current Kernel state.
   */
  public getState(): KernelStateSnapshot {
    return this._state.toSnapshot();
  }

  /**
   * Returns the current lifecycle status of the Kernel.
   */
  public getStatus(): KernelStatus {
    return this._state.status;
  }

  /**
   * Checks whether the Kernel is currently in the RUNNING state.
   */
  public isRunning(): boolean {
    return this._state.status === 'RUNNING';
  }

  /**
   * Retrieves a registered system service by name with strong typing.
   *
   * @template T - Expected service subtype.
   * @param name - The unique name of the service.
   * @returns The registered service instance.
   * @throws {ServiceNotFoundError} If no service is registered under that name.
   */
  public getService<T extends SystemService = SystemService>(name: string): T {
    return this._registry.get<T>(name);
  }

  /**
   * Registers a new system service into the Kernel registry.
   *
   * @param service - The system service instance to register.
   * @throws {InvalidKernelStateError} If hot-registration is disabled and Kernel is running.
   * @throws {ServiceAlreadyRegisteredError} If a service with the same name is already registered.
   */
  public registerService(service: SystemService): void {
    if (this.isRunning() && !this._config.allowHotRegistration) {
      throw new InvalidKernelStateError(this._state.status, 'registerService');
    }
    this._registry.register(service);
  }

  /**
   * Unregisters a service from the Kernel registry.
   *
   * @param name - The name of the service to unregister.
   * @throws {InvalidKernelStateError} If hot-registration is disabled and Kernel is running.
   * @throws {ServiceNotFoundError} If the service does not exist.
   */
  public unregisterService(name: string): void {
    if (this.isRunning() && !this._config.allowHotRegistration) {
      throw new InvalidKernelStateError(this._state.status, 'unregisterService');
    }
    this._registry.unregister(name);
  }

  /**
   * Returns a list of all currently registered system services.
   */
  public getServices(): SystemService[] {
    return this._registry.list();
  }

  /**
   * Subscribes a listener to a specific Kernel lifecycle event.
   *
   * @param type - The lifecycle event type.
   * @param listener - Callback function invoked when the event is emitted.
   * @returns An unsubscribe function to remove the listener.
   */
  public addEventListener(type: KernelEventType, listener: KernelEventListener): () => void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    const set = this._listeners.get(type)!;
    set.add(listener);

    return () => {
      this.removeEventListener(type, listener);
    };
  }

  /**
   * Unsubscribes a listener from a Kernel lifecycle event.
   *
   * @param type - The lifecycle event type.
   * @param listener - The callback function to remove.
   */
  public removeEventListener(type: KernelEventType, listener: KernelEventListener): void {
    const set = this._listeners.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this._listeners.delete(type);
      }
    }
  }

  /**
   * Initializes all registered system services in dependency order.
   *
   * @throws {InvalidKernelStateError} If Kernel is not in CREATED or STOPPED state.
   * @throws {MissingDependencyError} If a required dependency is missing.
   * @throws {CircularDependencyError} If circular dependencies are detected.
   * @throws {ServiceInitializationError} If a service fails to initialize.
   */
  public async initialize(): Promise<void> {
    const currentStatus = this._state.status;
    if (currentStatus === 'INITIALIZED') {
      return; // Already initialized
    }
    if (currentStatus === 'RUNNING' || currentStatus === 'STARTING') {
      throw new InvalidKernelStateError(currentStatus, 'initialize');
    }

    this._state.transitionTo('INITIALIZING', 'initialize');
    await this.emitEvent('SYSTEM_INITIALIZING');

    try {
      const services = this._registry.list();
      const startupOrder = ServiceDependencyResolver.resolveStartupOrder(services);

      for (const service of startupOrder) {
        if (typeof service.initialize === 'function') {
          this._config.logger?.debug?.(`Initializing service '${service.name}'...`);
          try {
            await this.executeWithTimeout(
              () => service.initialize!(),
              `initialize service '${service.name}'`
            );
          } catch (initErr) {
            throw new ServiceInitializationError(service.name, initErr);
          }
        }
      }

      this._state.transitionTo('INITIALIZED', 'initialize');
      await this.emitEvent('SYSTEM_INITIALIZED');
    } catch (error) {
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));
      this._state.fail(wrappedError);
      await this.emitEvent('SYSTEM_ERROR', undefined, wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Starts the WebOS Kernel and all registered services in dependency order.
   *
   * @throws {ServiceStartupError} If any service fails during startup.
   */
  public async start(): Promise<void> {
    if (this._state.status === 'RUNNING') {
      return; // Idempotent: already running
    }

    if (this._state.status === 'CREATED' && this._config.autoInitializeOnStart) {
      await this.initialize();
    } else if (this._state.status !== 'INITIALIZED' && this._state.status !== 'STOPPED') {
      throw new InvalidKernelStateError(this._state.status, 'start');
    }

    this._state.transitionTo('STARTING', 'start');
    await this.emitEvent('SYSTEM_STARTING');

    const services = this._registry.list();
    const startupOrder = ServiceDependencyResolver.resolveStartupOrder(services);
    const startedServices: SystemService[] = [];

    for (const service of startupOrder) {
      try {
        if (typeof service.start === 'function' && service.getStatus() !== 'RUNNING') {
          this._config.logger?.debug?.(`Starting service '${service.name}'...`);
          await this.executeWithTimeout(
            () => service.start!(),
            `start service '${service.name}'`
          );
        }
        startedServices.push(service);
      } catch (error) {
        // Handle startup failure: rollback already-started services
        this._config.logger?.error?.(
          `Service '${service.name}' failed to start. Rolling back...`,
          error
        );

        await this.rollbackStartedServices(startedServices);

        const startupError = new ServiceStartupError(service.name, error);
        this._state.fail(startupError);
        await this.emitEvent('SYSTEM_ERROR', undefined, startupError);
        throw startupError;
      }
    }

    this._state.transitionTo('RUNNING', 'start');
    await this.emitEvent('SYSTEM_STARTED');
  }

  /**
   * Stops the WebOS Kernel and all running services in reverse dependency order.
   *
   * @throws {ServiceShutdownError} If a critical error occurs during shutdown.
   */
  public async stop(): Promise<void> {
    if (this._state.status === 'STOPPED') {
      return; // Idempotent: already stopped
    }

    if (this._state.status !== 'RUNNING' && this._state.status !== 'INITIALIZED' && this._state.status !== 'FAILED') {
      throw new InvalidKernelStateError(this._state.status, 'stop');
    }

    this._state.transitionTo('STOPPING', 'stop');
    await this.emitEvent('SYSTEM_STOPPING');

    const services = this._registry.list();
    // Reverse dependency order
    const shutdownOrder = ServiceDependencyResolver.resolveShutdownOrder(services);
    const shutdownErrors: Array<{ serviceName: string; error: unknown }> = [];

    for (const service of shutdownOrder) {
      try {
        if (typeof service.stop === 'function' && service.getStatus() !== 'STOPPED') {
          this._config.logger?.debug?.(`Stopping service '${service.name}'...`);
          await this.executeWithTimeout(
            () => service.stop!(),
            `stop service '${service.name}'`
          );
        }
      } catch (error) {
        this._config.logger?.error?.(`Error stopping service '${service.name}':`, error);
        shutdownErrors.push({ serviceName: service.name, error });
      }
    }

    if (shutdownErrors.length > 0) {
      const primary = shutdownErrors[0]!;
      const shutdownError = new ServiceShutdownError(primary.serviceName, primary.error);
      this._state.fail(shutdownError);
      await this.emitEvent('SYSTEM_ERROR', undefined, shutdownError);
      throw shutdownError;
    }

    this._state.transitionTo('STOPPED', 'stop');
    await this.emitEvent('SYSTEM_STOPPED');
  }

  /**
   * Performs a clean restart of the Kernel:
   * 1. Stops running services
   * 2. Resets service instances
   * 3. Starts services again in dependency order
   */
  public async restart(): Promise<void> {
    if (this.isRunning()) {
      await this.stop();
    }

    // Reset services if they provide reset logic
    const services = this._registry.list();
    for (const service of services) {
      if (typeof service.reset === 'function') {
        try {
          await service.reset();
        } catch (err) {
          this._config.logger?.warn?.(`Error resetting service '${service.name}':`, err);
        }
      }
    }

    this._state.reset('INITIALIZED');
    await this.start();
  }

  /**
   * Helper to execute an async service lifecycle hook with an optional timeout.
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    operationName: string
  ): Promise<T> {
    const timeoutMs = this._config.serviceTimeoutMs;

    if (!timeoutMs || timeoutMs <= 0) {
      return await operation();
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new KernelTimeoutError(operationName, timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([Promise.resolve(operation()), timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Stops previously started services in reverse order when a service startup fails.
   */
  private async rollbackStartedServices(startedServices: SystemService[]): Promise<void> {
    const reverseStarted = [...startedServices].reverse();
    for (const service of reverseStarted) {
      try {
        if (typeof service.stop === 'function') {
          await this.executeWithTimeout(
            () => service.stop!(),
            `rollback stop service '${service.name}'`
          );
        }
      } catch (rollbackError) {
        this._config.logger?.error?.(
          `Failed to rollback service '${service.name}':`,
          rollbackError
        );
      }
    }
  }

  /**
   * Emits a Kernel lifecycle event to registered listeners.
   */
  private async emitEvent(
    type: KernelEventType,
    payload?: unknown,
    error?: Error
  ): Promise<void> {
    const event: KernelEvent = {
      type,
      timestamp: Date.now(),
      payload,
      error,
    };

    const listeners = this._listeners.get(type);
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of Array.from(listeners)) {
      try {
        await listener(event);
      } catch (err) {
        this._config.logger?.error?.(`Error in event listener for '${type}':`, err);
      }
    }
  }
}
