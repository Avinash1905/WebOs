import { describe, expect, it } from 'vitest';
import {
  CircularDependencyError,
  MissingDependencyError,
  ServiceDependencyResolver,
} from '../core/kernel/index.js';
import { MockService } from './mocks.js';

describe('ServiceDependencyResolver', () => {
  it('correctly resolves linear dependency chain (EventBus -> Storage -> FileSystem)', () => {
    const eventBus = new MockService('eventbus');
    const storage = new MockService('storage', ['eventbus']);
    const fileSystem = new MockService('filesystem', ['storage']);

    // Order of input array is shuffled intentionally
    const startupOrder = ServiceDependencyResolver.resolveStartupOrder([
      fileSystem,
      eventBus,
      storage,
    ]);

    expect(startupOrder.map((s: any) => s.name)).toEqual(['eventbus', 'storage', 'filesystem']);
  });

  it('correctly resolves complex diamond DAG with multiple dependencies', () => {
    //            EventBus
    //           /        \
    //       Storage      Auth
    //           \        /
    //           FileSystem
    //               |
    //          ProcessManager
    const eventBus = new MockService('eventbus');
    const storage = new MockService('storage', ['eventbus']);
    const auth = new MockService('auth', ['eventbus']);
    const fileSystem = new MockService('filesystem', ['storage', 'auth']);
    const processManager = new MockService('process', ['filesystem']);

    const startupOrder = ServiceDependencyResolver.resolveStartupOrder([
      processManager,
      fileSystem,
      auth,
      storage,
      eventBus,
    ]);

    const names = startupOrder.map((s: any) => s.name);

    expect(names.indexOf('eventbus')).toBeLessThan(names.indexOf('storage'));
    expect(names.indexOf('eventbus')).toBeLessThan(names.indexOf('auth'));
    expect(names.indexOf('storage')).toBeLessThan(names.indexOf('filesystem'));
    expect(names.indexOf('auth')).toBeLessThan(names.indexOf('filesystem'));
    expect(names.indexOf('filesystem')).toBeLessThan(names.indexOf('process'));
  });

  it('correctly resolves shutdown order as the exact reverse of startup order', () => {
    const eventBus = new MockService('eventbus');
    const storage = new MockService('storage', ['eventbus']);
    const fileSystem = new MockService('filesystem', ['storage']);

    const shutdownOrder = ServiceDependencyResolver.resolveShutdownOrder([
      eventBus,
      fileSystem,
      storage,
    ]);

    expect(shutdownOrder.map((s: any) => s.name)).toEqual(['filesystem', 'storage', 'eventbus']);
  });

  it('throws MissingDependencyError when a required dependency is missing', () => {
    const fileSystem = new MockService('filesystem', ['storage']);

    expect(() => ServiceDependencyResolver.resolveStartupOrder([fileSystem])).toThrowError(
      MissingDependencyError
    );

    try {
      ServiceDependencyResolver.resolveStartupOrder([fileSystem]);
    } catch (err) {
      expect(err).toBeInstanceOf(MissingDependencyError);
      const missingErr = err as MissingDependencyError;
      expect(missingErr.serviceName).toBe('filesystem');
      expect(missingErr.missingDependency).toBe('storage');
      expect(missingErr.message).toContain("Service 'filesystem' depends on missing service 'storage'");
    }
  });

  it('handles optional dependencies gracefully when optional service is missing', () => {
    const storage = new MockService('storage', [], ['telemetry']);

    // 'telemetry' is missing, but optional, so it should not throw
    const startupOrder = ServiceDependencyResolver.resolveStartupOrder([storage]);
    expect(startupOrder.map((s: any) => s.name)).toEqual(['storage']);
  });

  it('orders optional dependencies before dependents when optional service is registered', () => {
    const telemetry = new MockService('telemetry');
    const storage = new MockService('storage', [], ['telemetry']);

    const startupOrder = ServiceDependencyResolver.resolveStartupOrder([storage, telemetry]);
    expect(startupOrder.map((s: any) => s.name)).toEqual(['telemetry', 'storage']);
  });

  it('detects direct circular dependency (A -> B -> A)', () => {
    const serviceA = new MockService('A', ['B']);
    const serviceB = new MockService('B', ['A']);

    expect(() => ServiceDependencyResolver.resolveStartupOrder([serviceA, serviceB])).toThrowError(
      CircularDependencyError
    );

    try {
      ServiceDependencyResolver.resolveStartupOrder([serviceA, serviceB]);
    } catch (err) {
      expect(err).toBeInstanceOf(CircularDependencyError);
      const cycleErr = err as CircularDependencyError;
      expect(cycleErr.cycle).toBeDefined();
      expect(cycleErr.message).toMatch(/Circular dependency detected: (A -> B -> A|B -> A -> B)/);
    }
  });

  it('detects 3-node circular dependency (A -> B -> C -> A)', () => {
    const serviceA = new MockService('A', ['B']);
    const serviceB = new MockService('B', ['C']);
    const serviceC = new MockService('C', ['A']);

    expect(() =>
      ServiceDependencyResolver.resolveStartupOrder([serviceA, serviceB, serviceC])
    ).toThrowError(CircularDependencyError);

    try {
      ServiceDependencyResolver.resolveStartupOrder([serviceA, serviceB, serviceC]);
    } catch (err) {
      expect(err).toBeInstanceOf(CircularDependencyError);
      const cycleErr = err as CircularDependencyError;
      expect(cycleErr.message).toMatch(/Circular dependency detected:/);
      expect(cycleErr.cycle.length).toBe(4);
      expect(cycleErr.cycle[0]).toBe(cycleErr.cycle[cycleErr.cycle.length - 1]);
    }
  });

  it('detects self-referencing circular dependency (A -> A)', () => {
    const serviceA = new MockService('A', ['A']);

    expect(() => ServiceDependencyResolver.resolveStartupOrder([serviceA])).toThrowError(
      CircularDependencyError
    );
  });
});
