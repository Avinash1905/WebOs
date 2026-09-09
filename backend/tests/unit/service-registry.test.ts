/**
 * WebOS Backend Foundation - Service Registry Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { BaseService } from '../../src/services/base.service.js';
import { ServiceRegistry } from '../../src/services/service.registry.js';
import { createLogger } from '../../src/common/logging/logger.js';

class MockService extends BaseService {
  public initialized = false;
  public shutDown = false;

  constructor(name: string, logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] })) {
    super({ name, version: '1.0.0' }, { logger });
  }

  protected async onInitialize(): Promise<void> {
    this.initialized = true;
  }

  protected async onShutdown(): Promise<void> {
    this.shutDown = true;
  }
}

describe('Service & ServiceRegistry', () => {
  it('should transition service states across lifecycle', async () => {
    const service = new MockService('mock-auth');
    expect(service.getState()).toBe('uninitialized');

    await service.initialize();
    expect(service.getState()).toBe('ready');
    expect(service.initialized).toBe(true);

    await service.shutdown();
    expect(service.getState()).toBe('stopped');
    expect(service.shutDown).toBe(true);
  });

  it('should register and initialize multiple services in order, and shut down in reverse order', async () => {
    const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });
    const registry = new ServiceRegistry(logger);

    const order: string[] = [];

    class OrderTrackingService extends BaseService {
      constructor(name: string) {
        super({ name }, { logger });
      }
      protected async onInitialize(): Promise<void> {
        order.push(`init_${this.metadata.name}`);
      }
      protected async onShutdown(): Promise<void> {
        order.push(`shutdown_${this.metadata.name}`);
      }
    }

    const s1 = registry.register(new OrderTrackingService('serviceA'));
    const s2 = registry.register(new OrderTrackingService('serviceB'));

    expect(registry.has('serviceA')).toBe(true);
    expect(registry.get('serviceA')).toBe(s1);
    expect(registry.get('serviceB')).toBe(s2);

    await registry.initializeAll();
    expect(order).toEqual(['init_serviceA', 'init_serviceB']);

    await registry.shutdownAll();
    expect(order).toEqual([
      'init_serviceA',
      'init_serviceB',
      'shutdown_serviceB',
      'shutdown_serviceA'
    ]);
  });
});
