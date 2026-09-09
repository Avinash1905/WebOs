import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import {
  ServiceManager,
  ManagedSystemService,
  ServiceAlreadyRegisteredError,
  MissingServiceDependencyError,
  CircularServiceDependencyError,
  ServiceDependencyResolver,
} from '../../core/services/index.js';

class MockService extends ManagedSystemService {
  public override readonly id: string;
  public override readonly name: string;
  public override readonly dependencies: readonly string[];
  public override readonly optionalDependencies: readonly string[];
  public override readonly description?: string;
  public override readonly autoStart: boolean;

  public startCalls = 0;
  public stopCalls = 0;
  public pauseCalls = 0;
  public resumeCalls = 0;

  constructor(
    id: string,
    dependencies: readonly string[] = [],
    options?: { description?: string; autoStart?: boolean }
  ) {
    super();
    this.id = id;
    this.name = id;
    this.dependencies = dependencies;
    this.optionalDependencies = [];
    this.description = options?.description;
    this.autoStart = options?.autoStart ?? true;
  }

  protected override async onStart(): Promise<void> {
    this.startCalls++;
  }

  protected override async onStop(): Promise<void> {
    this.stopCalls++;
  }

  protected override async onPause(): Promise<void> {
    this.pauseCalls++;
  }

  protected override async onResume(): Promise<void> {
    this.resumeCalls++;
  }
}

class FailingService extends ManagedSystemService {
  public override readonly id: string;
  public override readonly name: string;

  constructor(id: string) {
    super();
    this.id = id;
    this.name = id;
  }

  protected override async onStart(): Promise<void> {
    throw new Error('Simulated startup failure');
  }
}

describe('Module 15: System Services Subsystem', () => {
  let eventBus: EventBus;
  let serviceManager: ServiceManager;

  beforeEach(() => {
    eventBus = new EventBus();
    serviceManager = new ServiceManager({ eventBus });
  });

  describe('Service Registration & Querying', () => {
    it('registers services with metadata descriptors', () => {
      const svc = new MockService('auth-service', [], {
        description: 'Handles user authentication',
        autoStart: true,
      });
      serviceManager.registerService(svc);

      expect(serviceManager.hasService('auth-service')).toBe(true);
      const retrieved = serviceManager.getService('auth-service');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('auth-service');
      expect(retrieved?.description).toBe('Handles user authentication');
      expect(retrieved?.autoStart).toBe(true);
      expect(retrieved?.getStatus()).toBe('REGISTERED');
    });

    it('throws error when registering duplicate service', () => {
      const svc1 = new MockService('db-service');
      const svc2 = new MockService('db-service');

      serviceManager.registerService(svc1);
      expect(() => serviceManager.registerService(svc2)).toThrow(ServiceAlreadyRegisteredError);
    });

    it('unregisters services correctly', async () => {
      const svc = new MockService('temp-service');
      serviceManager.registerService(svc);
      expect(serviceManager.hasService('temp-service')).toBe(true);

      await serviceManager.unregisterService('temp-service');
      expect(serviceManager.hasService('temp-service')).toBe(false);
    });

    it('returns undefined for non-existent service query', () => {
      expect(serviceManager.getService('ghost-service')).toBeUndefined();
    });
  });

  describe('Dependency Resolution & Ordering', () => {
    it('starts services in correct topological order based on dependencies', async () => {
      const order: string[] = [];

      class OrderTrackingService extends ManagedSystemService {
        public override readonly id: string;
        public override readonly name: string;
        public override readonly dependencies: readonly string[];

        constructor(id: string, dependencies: readonly string[] = []) {
          super();
          this.id = id;
          this.name = id;
          this.dependencies = dependencies;
        }
        protected override async onStart(): Promise<void> {
          order.push(this.id);
        }
      }

      const db = new OrderTrackingService('db');
      const auth = new OrderTrackingService('auth', ['db']);
      const api = new OrderTrackingService('api', ['auth']);

      // Register out of order
      serviceManager.registerService(api);
      serviceManager.registerService(db);
      serviceManager.registerService(auth);

      await serviceManager.startAll();

      expect(order).toEqual(['db', 'auth', 'api']);
    });

    it('stops services in reverse dependency order', async () => {
      const stopOrder: string[] = [];

      class StopOrderTrackingService extends ManagedSystemService {
        public override readonly id: string;
        public override readonly name: string;
        public override readonly dependencies: readonly string[];

        constructor(id: string, dependencies: readonly string[] = []) {
          super();
          this.id = id;
          this.name = id;
          this.dependencies = dependencies;
        }
        protected override async onStop(): Promise<void> {
          stopOrder.push(this.id);
        }
      }

      const db = new StopOrderTrackingService('db');
      const cache = new StopOrderTrackingService('cache', ['db']);
      const web = new StopOrderTrackingService('web', ['cache']);

      serviceManager.registerService(web);
      serviceManager.registerService(cache);
      serviceManager.registerService(db);

      await serviceManager.startAll();
      await serviceManager.stopAll();

      expect(stopOrder).toEqual(['web', 'cache', 'db']);
    });

    it('throws MissingServiceDependencyError when a required dependency is missing', async () => {
      const api = new MockService('api', ['non-existent-db']);
      serviceManager.registerService(api);

      await expect(serviceManager.startService('api')).rejects.toThrow(MissingServiceDependencyError);
    });

    it('throws CircularServiceDependencyError when circular dependencies are detected', () => {
      const svcA = new MockService('svc-a', ['svc-b']);
      const svcB = new MockService('svc-b', ['svc-a']);

      serviceManager.registerService(svcA);
      serviceManager.registerService(svcB);

      expect(() => ServiceDependencyResolver.resolveStartupOrder([svcA, svcB])).toThrow(
        CircularServiceDependencyError
      );
    });
  });

  describe('Lifecycle, Pause, Resume, Restart & Failure Isolation', () => {
    it('manages pause and resume states', async () => {
      const svc = new MockService('worker');
      serviceManager.registerService(svc);

      await serviceManager.startService('worker');
      expect(svc.getStatus()).toBe('RUNNING');

      await serviceManager.pauseService('worker');
      expect(svc.getStatus()).toBe('PAUSED');
      expect(svc.pauseCalls).toBe(1);

      await serviceManager.resumeService('worker');
      expect(svc.getStatus()).toBe('RUNNING');
      expect(svc.resumeCalls).toBe(1);
    });

    it('restarts a running service', async () => {
      const svc = new MockService('daemon');
      serviceManager.registerService(svc);

      await serviceManager.startService('daemon');
      expect(svc.startCalls).toBe(1);

      await serviceManager.restartService('daemon');
      expect(svc.stopCalls).toBe(1);
      expect(svc.startCalls).toBe(2);
      expect(svc.getStatus()).toBe('RUNNING');
    });

    it('isolates service failure and tracks failed status without breaking manager', async () => {
      const failing = new FailingService('crasher');
      const healthy = new MockService('healthy');

      serviceManager.registerService(failing);
      serviceManager.registerService(healthy);

      await expect(serviceManager.startService('crasher')).rejects.toThrow();

      const failedServices = serviceManager.getFailedServices();
      expect(failedServices.length).toBe(1);
      expect(failedServices[0]?.id).toBe('crasher');

      // Healthy service can still start
      await serviceManager.startService('healthy');
      expect(healthy.getStatus()).toBe('RUNNING');

      const runningServices = serviceManager.getRunningServices();
      expect(runningServices.some((s) => s.id === 'healthy')).toBe(true);
    });
  });

  describe('Health Tracking & EventBus Integration', () => {
    it('tracks health status, error counts, and uptime', async () => {
      const svc = new MockService('health-monitored');
      serviceManager.registerService(svc);
      await serviceManager.startService('health-monitored');

      const health = await serviceManager.checkServiceHealth('health-monitored');
      expect(health).toBeDefined();
      expect(health.status).toBe('HEALTHY');
      expect(health.uptimeMs).toBeGreaterThanOrEqual(0);
      expect(health.errorCount).toBe(0);
    });

    it('emits lifecycle events over EventBus', async () => {
      const events: string[] = [];
      eventBus.subscribe('service.registered', () => { events.push('registered'); });
      eventBus.subscribe('service.started', () => { events.push('started'); });
      eventBus.subscribe('service.stopped', () => { events.push('stopped'); });

      const svc = new MockService('event-test');
      serviceManager.registerService(svc);
      await serviceManager.startService('event-test');
      await serviceManager.stopService('event-test');

      expect(events).toContain('registered');
      expect(events).toContain('started');
      expect(events).toContain('stopped');
    });
  });
});
