/**
 * WebOS Backend Foundation - Service Registry
 * Central registry for managing domain services and their lifecycles.
 */

import type { IService } from './service.types.js';
import type { ILogger } from '../common/logging/logger.types.js';

export class ServiceRegistry {
  private readonly services: Map<string, IService> = new Map();
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger.child({ subsystem: 'service-registry' });
  }

  public register<T extends IService>(service: T): T {
    const name = service.metadata.name;
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }
    this.services.set(name, service);
    this.logger.debug({ service: name }, `Registered service '${name}'`);
    return service;
  }

  public get<T extends IService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' is not registered`);
    }
    return service as T;
  }

  public has(name: string): boolean {
    return this.services.has(name);
  }

  public getAll(): readonly IService[] {
    return Array.from(this.services.values());
  }

  public async initializeAll(): Promise<void> {
    for (const service of this.services.values()) {
      await service.initialize();
    }
  }

  public async shutdownAll(): Promise<void> {
    const serviceList = Array.from(this.services.values()).reverse();
    for (const service of serviceList) {
      try {
        await service.shutdown();
      } catch (err) {
        this.logger.error(
          { service: service.metadata.name, err },
          `Error shutting down service '${service.metadata.name}'`
        );
      }
    }
  }
}
