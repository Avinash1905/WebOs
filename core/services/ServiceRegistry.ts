/**
 * @file ServiceRegistry.ts
 * @description Central in-memory registry for System Services.
 */

import {
  ServiceAlreadyRegisteredError,
  ServiceNotFoundError,
} from './ServiceError.js';
import type { SystemService } from './types.js';

export class ServiceRegistry {
  private readonly _services = new Map<string, SystemService>();

  public register(service: SystemService): void {
    if (this._services.has(service.id)) {
      throw new ServiceAlreadyRegisteredError(service.id);
    }
    this._services.set(service.id, service);
  }

  public unregister(serviceId: string): boolean {
    if (!this._services.has(serviceId)) {
      throw new ServiceNotFoundError(serviceId);
    }
    return this._services.delete(serviceId);
  }

  public get(serviceId: string): SystemService | undefined {
    return this._services.get(serviceId);
  }

  public getOrThrow(serviceId: string): SystemService {
    const service = this._services.get(serviceId);
    if (!service) {
      throw new ServiceNotFoundError(serviceId);
    }
    return service;
  }

  public has(serviceId: string): boolean {
    return this._services.has(serviceId);
  }

  public getAll(): SystemService[] {
    return Array.from(this._services.values());
  }

  public getRunning(): SystemService[] {
    return this.getAll().filter((s) => s.getStatus() === 'RUNNING');
  }

  public getFailed(): SystemService[] {
    return this.getAll().filter((s) => s.getStatus() === 'FAILED');
  }

  public size(): number {
    return this._services.size;
  }

  public clear(): void {
    this._services.clear();
  }
}
