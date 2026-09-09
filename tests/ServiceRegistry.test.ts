import { describe, expect, it } from 'vitest';
import {
  ServiceAlreadyRegisteredError,
  ServiceNotFoundError,
  ServiceRegistry,
} from '../core/kernel/index.js';
import { MockService } from './mocks.js';

describe('ServiceRegistry', () => {
  it('registers and retrieves a service by name', () => {
    const registry = new ServiceRegistry();
    const service = new MockService('storage');

    registry.register(service);

    expect(registry.has('storage')).toBe(true);
    expect(registry.get('storage')).toBe(service);
    expect(registry.size).toBe(1);
  });

  it('lists all registered services and names', () => {
    const registry = new ServiceRegistry();
    const s1 = new MockService('eventbus');
    const s2 = new MockService('storage');
    const s3 = new MockService('filesystem');

    registry.register(s1);
    registry.register(s2);
    registry.register(s3);

    expect(registry.list()).toEqual([s1, s2, s3]);
    expect(registry.getNames()).toEqual(['eventbus', 'storage', 'filesystem']);
    expect(registry.size).toBe(3);
  });

  it('unregisters a service successfully', () => {
    const registry = new ServiceRegistry();
    const service = new MockService('eventbus');

    registry.register(service);
    expect(registry.has('eventbus')).toBe(true);

    const removed = registry.unregister('eventbus');
    expect(removed).toBe(service);
    expect(registry.has('eventbus')).toBe(false);
    expect(registry.size).toBe(0);
  });

  it('throws ServiceAlreadyRegisteredError when registering duplicate service name', () => {
    const registry = new ServiceRegistry();
    const s1 = new MockService('storage');
    const s2 = new MockService('storage');

    registry.register(s1);

    expect(() => registry.register(s2)).toThrowError(ServiceAlreadyRegisteredError);
    try {
      registry.register(s2);
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceAlreadyRegisteredError);
      expect((err as ServiceAlreadyRegisteredError).serviceName).toBe('storage');
    }
  });

  it('throws ServiceNotFoundError when getting an unregistered service', () => {
    const registry = new ServiceRegistry();

    expect(() => registry.get('nonexistent')).toThrowError(ServiceNotFoundError);
    try {
      registry.get('nonexistent');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceNotFoundError);
      expect((err as ServiceNotFoundError).serviceName).toBe('nonexistent');
    }
  });

  it('throws ServiceNotFoundError when unregistering an unregistered service', () => {
    const registry = new ServiceRegistry();

    expect(() => registry.unregister('nonexistent')).toThrowError(ServiceNotFoundError);
  });

  it('returns service status and metadata info', () => {
    const registry = new ServiceRegistry();
    const s1 = new MockService('fs', ['storage'], ['eventbus']);

    registry.register(s1);

    expect(registry.getServiceState('fs')).toBe('REGISTERED');
    const infos = registry.getServiceInfos();
    expect(infos).toHaveLength(1);
    expect(infos[0]).toEqual({
      name: 'fs',
      status: 'REGISTERED',
      dependencies: ['storage'],
      optionalDependencies: ['eventbus'],
    });
  });

  it('clears all registered services', () => {
    const registry = new ServiceRegistry();
    registry.register(new MockService('s1'));
    registry.register(new MockService('s2'));

    expect(registry.size).toBe(2);
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.list()).toEqual([]);
  });
});
