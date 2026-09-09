/**
 * @file ServiceRegistry.ts
 * @description Central repository for registering, retrieving, and tracking WebOS system services.
 */

import {
  ServiceAlreadyRegisteredError,
  ServiceNotFoundError,
} from './KernelError.js';
import type { SystemService } from './Service.js';
import type { ServiceInfo, ServiceStatus } from './types.js';

/**
 * Registry managing all WebOS core system services and their states.
 */
export class ServiceRegistry {
  private readonly _services: Map<string, SystemService> = new Map();

  /**
   * Registers a new system service.
   *
   * @param service - The SystemService instance to register.
   * @throws {ServiceAlreadyRegisteredError} If a service with the same name is already registered.
   */
  public register(service: SystemService): void {
    if (!service || typeof service.name !== 'string' || service.name.trim() === '') {
      throw new Error('Service must have a non-empty string name.');
    }

    if (this._services.has(service.name)) {
      throw new ServiceAlreadyRegisteredError(service.name);
    }

    this._services.set(service.name, service);
  }

  /**
   * Unregisters a service by its unique name.
   *
   * @param name - The name of the service to unregister.
   * @returns The unregistered SystemService instance.
   * @throws {ServiceNotFoundError} If the service is not found in the registry.
   */
  public unregister(name: string): SystemService {
    const service = this._services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(name);
    }

    this._services.delete(name);
    return service;
  }

  /**
   * Retrieves a registered service by name.
   *
   * @template T - Specific SystemService subtype expected by caller.
   * @param name - The name of the service to retrieve.
   * @returns The registered service instance typed as T.
   * @throws {ServiceNotFoundError} If no service is registered under the given name.
   */
  public get<T extends SystemService = SystemService>(name: string): T {
    const service = this._services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(name);
    }
    return service as T;
  }

  /**
   * Checks whether a service with the given name is registered.
   *
   * @param name - The service name to check.
   * @returns True if registered, false otherwise.
   */
  public has(name: string): boolean {
    return this._services.has(name);
  }

  /**
   * Returns an array of all currently registered system services.
   */
  public list(): SystemService[] {
    return Array.from(this._services.values());
  }

  /**
   * Returns an array of all registered service names.
   */
  public getNames(): string[] {
    return Array.from(this._services.keys());
  }

  /**
   * Returns read-only descriptor info for all registered services.
   */
  public getServiceInfos(): ServiceInfo[] {
    return this.list().map((service) => ({
      name: service.name,
      status: service.getStatus(),
      dependencies: service.dependencies ? [...service.dependencies] : [],
      optionalDependencies: service.optionalDependencies ? [...service.optionalDependencies] : [],
    }));
  }

  /**
   * Gets the current lifecycle state of a specific service.
   *
   * @param name - The name of the service.
   * @throws {ServiceNotFoundError} If the service is not registered.
   */
  public getServiceState(name: string): ServiceStatus {
    const service = this.get(name);
    return service.getStatus();
  }

  /**
   * Returns the count of registered services.
   */
  public get size(): number {
    return this._services.size;
  }

  /**
   * Clears all registered services from the registry.
   */
  public clear(): void {
    this._services.clear();
  }
}
