import { describe, expect, it } from 'vitest';
import {
  InvalidKernelStateError,
  Kernel,
  KernelEventType,
  ServiceInitializationError,
  ServiceShutdownError,
  ServiceStartupError,
} from '../core/kernel/index.js';
import { MockService, type MockServiceCallLog } from './mocks.js';

describe('Kernel Lifecycle & Orchestration', () => {
  it('manages service registration and retrieval through Kernel API', () => {
    const kernel = new Kernel();
    const storage = new MockService('storage');

    kernel.registerService(storage);

    expect(kernel.getServices()).toEqual([storage]);
    expect(kernel.getService<MockService>('storage')).toBe(storage);

    kernel.unregisterService('storage');
    expect(kernel.getServices()).toEqual([]);
  });

  it('rejects service registration while Kernel is running if hot registration is disabled', async () => {
    const kernel = new Kernel({ allowHotRegistration: false });
    const s1 = new MockService('s1');
    kernel.registerService(s1);

    await kernel.start();
    expect(kernel.isRunning()).toBe(true);

    const s2 = new MockService('s2');
    expect(() => kernel.registerService(s2)).toThrowError(InvalidKernelStateError);
    expect(() => kernel.unregisterService('s1')).toThrowError(InvalidKernelStateError);

    await kernel.stop();
  });

  it('executes full lifecycle: initialize -> start -> stop in correct dependency order', async () => {
    const callLog: MockServiceCallLog[] = [];
    const eventBus = new MockService('eventbus', [], [], callLog);
    const storage = new MockService('storage', ['eventbus'], [], callLog);
    const filesystem = new MockService('filesystem', ['storage'], [], callLog);

    const kernel = new Kernel();
    kernel.registerService(filesystem);
    kernel.registerService(eventBus);
    kernel.registerService(storage);

    // 1. Initialize
    expect(kernel.getStatus()).toBe('CREATED');
    await kernel.initialize();
    expect(kernel.getStatus()).toBe('INITIALIZED');

    expect(eventBus.initializeCallCount).toBe(1);
    expect(storage.initializeCallCount).toBe(1);
    expect(filesystem.initializeCallCount).toBe(1);

    // Verify initialization order
    const initLogs = callLog.filter((l) => l.action === 'initialize');
    expect(initLogs.map((l) => l.service)).toEqual(['eventbus', 'storage', 'filesystem']);

    // 2. Start
    await kernel.start();
    expect(kernel.getStatus()).toBe('RUNNING');
    expect(kernel.isRunning()).toBe(true);
    expect(kernel.getState().startedAt).toBeDefined();

    const startLogs = callLog.filter((l) => l.action === 'start');
    expect(startLogs.map((l) => l.service)).toEqual(['eventbus', 'storage', 'filesystem']);

    // 3. Stop
    await kernel.stop();
    expect(kernel.getStatus()).toBe('STOPPED');
    expect(kernel.isRunning()).toBe(false);
    expect(kernel.getState().stoppedAt).toBeDefined();

    // Verify shutdown order is reverse
    const stopLogs = callLog.filter((l) => l.action === 'stop');
    expect(stopLogs.map((l) => l.service)).toEqual(['filesystem', 'storage', 'eventbus']);
  });

  it('automatically initializes when start() is called on CREATED kernel', async () => {
    const callLog: MockServiceCallLog[] = [];
    const eventBus = new MockService('eventbus', [], [], callLog);

    const kernel = new Kernel({ autoInitializeOnStart: true });
    kernel.registerService(eventBus);

    await kernel.start();

    expect(kernel.isRunning()).toBe(true);
    expect(eventBus.initializeCallCount).toBe(1);
    expect(eventBus.startCallCount).toBe(1);

    await kernel.stop();
  });

  it('is idempotent when start() is called on an already running Kernel', async () => {
    const s1 = new MockService('s1');
    const kernel = new Kernel();
    kernel.registerService(s1);

    await kernel.start();
    expect(s1.startCallCount).toBe(1);

    // Call start again
    await kernel.start();
    expect(s1.startCallCount).toBe(1); // Not started again

    await kernel.stop();
  });

  it('is idempotent when stop() is called on an already stopped Kernel', async () => {
    const s1 = new MockService('s1');
    const kernel = new Kernel();
    kernel.registerService(s1);

    await kernel.start();
    await kernel.stop();
    expect(s1.stopCallCount).toBe(1);

    // Call stop again
    await kernel.stop();
    expect(s1.stopCallCount).toBe(1);
  });

  it('prevents invalid lifecycle operations (e.g. initializing while running)', async () => {
    const s1 = new MockService('s1');
    const kernel = new Kernel();
    kernel.registerService(s1);

    await kernel.start();
    await expect(kernel.initialize()).rejects.toThrowError(InvalidKernelStateError);

    await kernel.stop();
  });

  it('handles initialization failures and sets Kernel state to FAILED', async () => {
    const s1 = new MockService('s1');
    const s2 = new MockService('s2', ['s1']);
    s2.shouldFailInit = true;

    const kernel = new Kernel();
    kernel.registerService(s1);
    kernel.registerService(s2);

    await expect(kernel.initialize()).rejects.toThrowError(ServiceInitializationError);

    expect(kernel.getStatus()).toBe('FAILED');
    expect(kernel.getState().failedAt).toBeDefined();
    expect(kernel.getState().error).toBeDefined();
  });

  it('rolls back previously started services in reverse order when a service fails during startup', async () => {
    const callLog: MockServiceCallLog[] = [];
    const eventBus = new MockService('eventbus', [], [], callLog);
    const storage = new MockService('storage', ['eventbus'], [], callLog);
    const filesystem = new MockService('filesystem', ['storage'], [], callLog);

    filesystem.shouldFailStart = true; // filesystem will throw during start()

    const kernel = new Kernel();
    kernel.registerService(filesystem);
    kernel.registerService(eventBus);
    kernel.registerService(storage);

    await expect(kernel.start()).rejects.toThrowError(ServiceStartupError);

    expect(kernel.getStatus()).toBe('FAILED');
    expect(kernel.isRunning()).toBe(false);

    // Verify that eventBus and storage were started, then rolled back (stopped) in reverse order
    const stopLogs = callLog.filter((l) => l.action === 'stop');
    expect(stopLogs.map((l) => l.service)).toEqual(['storage', 'eventbus']);
  });

  it('handles shutdown failures safely and reports ServiceShutdownError', async () => {
    const s1 = new MockService('s1');
    s1.shouldFailStop = true;

    const kernel = new Kernel();
    kernel.registerService(s1);

    await kernel.start();
    await expect(kernel.stop()).rejects.toThrowError(ServiceShutdownError);
    expect(kernel.getStatus()).toBe('FAILED');
  });

  it('supports clean restart: stops, resets, and restarts services', async () => {
    const callLog: MockServiceCallLog[] = [];
    const s1 = new MockService('s1', [], [], callLog);
    const s2 = new MockService('s2', ['s1'], [], callLog);

    const kernel = new Kernel();
    kernel.registerService(s1);
    kernel.registerService(s2);

    await kernel.start();
    expect(kernel.isRunning()).toBe(true);

    await kernel.restart();

    expect(kernel.isRunning()).toBe(true);
    expect(s1.stopCallCount).toBe(1);
    expect(s2.stopCallCount).toBe(1);
    expect(s1.resetCallCount).toBe(1);
    expect(s2.resetCallCount).toBe(1);
    expect(s1.startCallCount).toBe(2);
    expect(s2.startCallCount).toBe(2);

    await kernel.stop();
  });

  it('emits lifecycle events in order and allows unsubscribing', async () => {
    const emittedEvents: KernelEventType[] = [];
    const kernel = new Kernel();
    const s1 = new MockService('s1');
    kernel.registerService(s1);

    const unsubInit = kernel.addEventListener('SYSTEM_INITIALIZING', (e) => {
      emittedEvents.push(e.type);
    });
    kernel.addEventListener('SYSTEM_INITIALIZED', (e) => {
      emittedEvents.push(e.type);
    });
    kernel.addEventListener('SYSTEM_STARTING', (e) => {
      emittedEvents.push(e.type);
    });
    kernel.addEventListener('SYSTEM_STARTED', (e) => {
      emittedEvents.push(e.type);
    });
    kernel.addEventListener('SYSTEM_STOPPING', (e) => {
      emittedEvents.push(e.type);
    });
    kernel.addEventListener('SYSTEM_STOPPED', (e) => {
      emittedEvents.push(e.type);
    });

    await kernel.initialize();
    await kernel.start();
    await kernel.stop();

    expect(emittedEvents).toEqual([
      'SYSTEM_INITIALIZING',
      'SYSTEM_INITIALIZED',
      'SYSTEM_STARTING',
      'SYSTEM_STARTED',
      'SYSTEM_STOPPING',
      'SYSTEM_STOPPED',
    ]);

    // Test unsubscribing
    unsubInit();
    emittedEvents.length = 0;

    await kernel.initialize();
    expect(emittedEvents).toEqual(['SYSTEM_INITIALIZED']);
  });

  it('enforces service lifecycle timeout and aborts hanging service during startup', async () => {
    const hangingService = new MockService('hanging');
    hangingService.delayStartMs = 200; // takes 200ms during start

    // Set timeout to 50ms
    const kernel = new Kernel({ serviceTimeoutMs: 50 });
    kernel.registerService(hangingService);

    await expect(kernel.start()).rejects.toThrowError(ServiceStartupError);
    expect(kernel.getStatus()).toBe('FAILED');
  });

  it('enforces service lifecycle timeout and aborts hanging service during initialization', async () => {
    const hangingService = new MockService('hanging_init');
    hangingService.delayInitMs = 200; // takes 200ms during init

    const kernel = new Kernel({ serviceTimeoutMs: 50 });
    kernel.registerService(hangingService);

    await expect(kernel.initialize()).rejects.toThrowError(ServiceInitializationError);
    expect(kernel.getStatus()).toBe('FAILED');
  });
});
