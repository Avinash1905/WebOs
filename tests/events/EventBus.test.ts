import { describe, expect, it, vi } from 'vitest';
import {
  EventBus,
  EventEmissionError,
  InvalidEventBusConfigError,
  InvalidEventTypeError,
  InvalidListenerError,
  type SystemEvent,
} from '../../core/events/index.js';
import { Kernel } from '../../core/kernel/index.js';

describe('System Event Bus (Module 2)', () => {
  // =========================================================================
  // 1. Basic Subscription and Emission
  // =========================================================================
  describe('Basic Events', () => {
    it('subscribes to an event and receives strongly-typed payload', () => {
      const eventBus = new EventBus();
      const received: string[] = [];

      const unsub = eventBus.subscribe('FILE_CREATED', (payload) => {
        received.push(payload.path);
      });

      expect(eventBus.hasSubscribers('FILE_CREATED')).toBe(true);
      expect(eventBus.listenerCount('FILE_CREATED')).toBe(1);

      eventBus.emit('FILE_CREATED', { path: '/documents/report.txt', size: 1024 });

      expect(received).toEqual(['/documents/report.txt']);

      unsub();
      expect(eventBus.hasSubscribers('FILE_CREATED')).toBe(false);
      expect(eventBus.listenerCount('FILE_CREATED')).toBe(0);

      eventBus.emit('FILE_CREATED', { path: '/documents/notes.txt' });
      expect(received).toEqual(['/documents/report.txt']); // Not called after unsubscribe
    });

    it('supports multiple subscribers for the same event', () => {
      const eventBus = new EventBus();
      const calls: number[] = [];

      eventBus.subscribe('PROCESS_STARTED', () => {
        calls.push(1);
      });
      eventBus.subscribe('PROCESS_STARTED', () => {
        calls.push(2);
      });
      eventBus.subscribe('PROCESS_STARTED', () => {
        calls.push(3);
      });

      expect(eventBus.listenerCount('PROCESS_STARTED')).toBe(3);

      eventBus.emit('PROCESS_STARTED', { pid: 100, name: 'editor' });

      expect(calls).toEqual([1, 2, 3]);
    });

    it('explicitly unsubscribes a listener function reference', () => {
      const eventBus = new EventBus();
      let callCount = 0;
      const handler = () => {
        callCount++;
      };

      eventBus.subscribe('USER_LOGIN', handler);
      eventBus.emit('USER_LOGIN', { userId: 'u1', username: 'alice' });
      expect(callCount).toBe(1);

      const removed = eventBus.unsubscribe('USER_LOGIN', handler);
      expect(removed).toBe(true);

      eventBus.emit('USER_LOGIN', { userId: 'u1', username: 'alice' });
      expect(callCount).toBe(1);

      // Unsubscribing again returns false safely
      expect(eventBus.unsubscribe('USER_LOGIN', handler)).toBe(false);
    });
  });

  // =========================================================================
  // 2. Once Subscriptions
  // =========================================================================
  describe('Once Subscriptions', () => {
    it('executes one-time subscription only once and automatically unsubscribes', () => {
      const eventBus = new EventBus();
      let executionCount = 0;

      eventBus.once('APP_OPENED', () => {
        executionCount++;
      });

      expect(eventBus.listenerCount('APP_OPENED')).toBe(1);

      eventBus.emit('APP_OPENED', { appId: 'calculator', instanceId: 'inst_1' });
      expect(executionCount).toBe(1);
      expect(eventBus.listenerCount('APP_OPENED')).toBe(0);

      // Second emission does not invoke listener
      eventBus.emit('APP_OPENED', { appId: 'calculator', instanceId: 'inst_2' });
      expect(executionCount).toBe(1);
    });
  });

  // =========================================================================
  // 3. Event Envelopes & Metadata
  // =========================================================================
  describe('Event Envelope & Metadata', () => {
    it('generates unique event ID, timestamp, and attaches envelope metadata', () => {
      const eventBus = new EventBus({ defaultSource: 'filesystem' });
      let capturedEvent: SystemEvent<any> | undefined = undefined;

      eventBus.subscribe('FILE_DELETED', (_payload, event) => {
        capturedEvent = event;
      });

      const returnedEvent = eventBus.emit(
        'FILE_DELETED',
        { path: '/tmp/cache.tmp' },
        {
          correlationId: 'corr_123',
          userId: 'user_42',
          processId: 101,
          applicationId: 'finder',
        }
      );

      expect(capturedEvent).toBeDefined();
      expect(capturedEvent).toBe(returnedEvent);
      const evt = capturedEvent as unknown as SystemEvent<any>;
      expect(evt.id).toMatch(/^evt_\d+_\d+_[a-z0-9]+$/);
      expect(evt.type).toBe('FILE_DELETED');
      expect(evt.timestamp).toBeGreaterThan(0);
      expect(evt.source).toBe('filesystem');
      expect(evt.correlationId).toBe('corr_123');
      expect(evt.userId).toBe('user_42');
      expect(evt.processId).toBe(101);
      expect(evt.applicationId).toBe('finder');
      expect(evt.payload).toEqual({ path: '/tmp/cache.tmp' });
    });

    it('generates unique IDs for sequential event emissions', () => {
      const eventBus = new EventBus();
      const e1 = eventBus.emit('STORAGE_READY', { driver: 'indexeddb' });
      const e2 = eventBus.emit('STORAGE_READY', { driver: 'indexeddb' });

      expect(e1.id).not.toBe(e2.id);
    });
  });

  // =========================================================================
  // 4. Listener Priorities
  // =========================================================================
  describe('Listener Priorities', () => {
    it('executes higher priority listeners before lower priority listeners', () => {
      const eventBus = new EventBus();
      const executionOrder: string[] = [];

      eventBus.subscribe('SYSTEM_STOPPING', () => {
        executionOrder.push('low');
      }, { priority: -10 });
      eventBus.subscribe('SYSTEM_STOPPING', () => {
        executionOrder.push('critical');
      }, { priority: 100 });
      eventBus.subscribe('SYSTEM_STOPPING', () => {
        executionOrder.push('normal');
      }, { priority: 0 });
      eventBus.subscribe('SYSTEM_STOPPING', () => {
        executionOrder.push('high');
      }, { priority: 50 });

      eventBus.emit('SYSTEM_STOPPING', {});

      expect(executionOrder).toEqual(['critical', 'high', 'normal', 'low']);
    });

    it('preserves FIFO registration order for listeners with equal priority', () => {
      const eventBus = new EventBus();
      const executionOrder: string[] = [];

      eventBus.subscribe('FILE_RENAMED', () => {
        executionOrder.push('first');
      }, { priority: 10 });
      eventBus.subscribe('FILE_RENAMED', () => {
        executionOrder.push('second');
      }, { priority: 10 });
      eventBus.subscribe('FILE_RENAMED', () => {
        executionOrder.push('third');
      }, { priority: 10 });

      eventBus.emit('FILE_RENAMED', { oldPath: '/a.txt', newPath: '/b.txt' });

      expect(executionOrder).toEqual(['first', 'second', 'third']);
    });
  });

  // =========================================================================
  // 5. Global / Wildcard Listeners
  // =========================================================================
  describe('Global Listeners (subscribeAll)', () => {
    it('receives all emitted events across all categories with full envelope', () => {
      const eventBus = new EventBus();
      const capturedTypes: string[] = [];

      const unsub = eventBus.subscribeAll((event) => {
        capturedTypes.push(event.type);
      });

      eventBus.emit('FILE_CREATED', { path: '/a' });
      eventBus.emit('PROCESS_STARTED', { pid: 1, name: 'init' });
      eventBus.emit('USER_LOGIN', { userId: 'u1', username: 'bob' });

      expect(capturedTypes).toEqual(['FILE_CREATED', 'PROCESS_STARTED', 'USER_LOGIN']);

      unsub();
      eventBus.emit('STORAGE_READY', { driver: 'local' });
      expect(capturedTypes).toEqual(['FILE_CREATED', 'PROCESS_STARTED', 'USER_LOGIN']);
    });
  });

  // =========================================================================
  // 6. Asynchronous Events (emitAsync)
  // =========================================================================
  describe('Asynchronous Events (emitAsync)', () => {
    it('awaits async listeners and respects priorities during async emission', async () => {
      const eventBus = new EventBus();
      const order: string[] = [];

      eventBus.subscribe(
        'FILE_COPIED',
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          order.push('high_priority_async');
        },
        { priority: 10 }
      );

      eventBus.subscribe(
        'FILE_COPIED',
        async () => {
          order.push('normal_priority_async');
        },
        { priority: 0 }
      );

      await eventBus.emitAsync('FILE_COPIED', {
        sourcePath: '/src.txt',
        destinationPath: '/dst.txt',
      });

      expect(order).toEqual(['high_priority_async', 'normal_priority_async']);
    });

    it('safely handles async listener rejections without unhandled promise rejections', async () => {
      const eventBus = new EventBus();
      let otherExecuted = false;

      eventBus.subscribe('APP_ERROR', async () => {
        throw new Error('Async handler exploded');
      });

      eventBus.subscribe('APP_ERROR', async () => {
        otherExecuted = true;
      });

      await expect(
        eventBus.emitAsync('APP_ERROR', { appId: 'app1', error: 'Init error' })
      ).resolves.toBeDefined();

      expect(otherExecuted).toBe(true);
    });
  });

  // =========================================================================
  // 7. Error Isolation & Safety
  // =========================================================================
  describe('Error Isolation', () => {
    it('continues executing subsequent listeners when one listener throws', () => {
      const eventBus = new EventBus();
      let listenerExecuted = false;

      eventBus.subscribe('STORAGE_CHANGED', () => {
        throw new Error('Subscriber error');
      });

      eventBus.subscribe('STORAGE_CHANGED', () => {
        listenerExecuted = true;
      });

      eventBus.emit('STORAGE_CHANGED', { action: 'set', key: 'theme' });

      expect(listenerExecuted).toBe(true);
    });

    it('emits SYSTEM_ERROR on listener failure without causing infinite recursion', () => {
      const eventBus = new EventBus();
      const errorsCaptured: string[] = [];

      eventBus.subscribe('SYSTEM_ERROR', (payload) => {
        errorsCaptured.push(String(payload.error));
        // Intentionally throw inside error handler to test recursion guard
        throw new Error('Error handler failed');
      });

      eventBus.subscribe('FILE_DELETED', () => {
        throw new Error('Original File Delete Error');
      });

      expect(() => {
        eventBus.emit('FILE_DELETED', { path: '/file.txt' });
      }).not.toThrow();

      expect(errorsCaptured.length).toBe(1);
      expect(errorsCaptured[0]).toContain('Original File Delete Error');
    });

    it('throws EventEmissionError when captureListenerErrors is disabled', () => {
      const eventBus = new EventBus({ captureListenerErrors: false });

      eventBus.subscribe('FILE_CREATED', () => {
        throw new Error('Forced emission error');
      });

      expect(() => {
        eventBus.emit('FILE_CREATED', { path: '/a.txt' });
      }).toThrowError(EventEmissionError);
    });
  });

  // =========================================================================
  // 8. Event History & Query Filtering
  // =========================================================================
  describe('Bounded Event History', () => {
    it('records events in history up to maxHistorySize (evicts oldest first)', () => {
      const eventBus = new EventBus({ maxHistorySize: 3 });

      eventBus.emit('FILE_CREATED', { path: '/1' });
      eventBus.emit('FILE_CREATED', { path: '/2' });
      eventBus.emit('FILE_CREATED', { path: '/3' });

      expect(eventBus.getHistory().length).toBe(3);
      expect(eventBus.getHistory().map((e) => (e.payload as any).path)).toEqual(['/1', '/2', '/3']);

      // Emit 4th event -> 1st event should be evicted
      eventBus.emit('FILE_CREATED', { path: '/4' });

      expect(eventBus.getHistory().length).toBe(3);
      expect(eventBus.getHistory().map((e) => (e.payload as any).path)).toEqual(['/2', '/3', '/4']);
    });

    it('does not record history when historyEnabled is false', () => {
      const eventBus = new EventBus({ historyEnabled: false });

      eventBus.emit('FILE_CREATED', { path: '/test' });
      expect(eventBus.getHistory()).toEqual([]);
    });

    it('filters history by event type, source, correlationId, and limit', () => {
      const eventBus = new EventBus({ maxHistorySize: 50 });

      eventBus.emit('FILE_CREATED', { path: '/doc.txt' }, { source: 'fs', correlationId: 'job_1' });
      eventBus.emit('FILE_DELETED', { path: '/old.txt' }, { source: 'fs', correlationId: 'job_2' });
      eventBus.emit('PROCESS_STARTED', { pid: 1, name: 'sh' }, { source: 'pm', correlationId: 'job_1' });

      const fsEvents = eventBus.getHistory({ source: 'fs' });
      expect(fsEvents.length).toBe(2);

      const job1Events = eventBus.getHistory({ correlationId: 'job_1' });
      expect(job1Events.length).toBe(2);

      const fileCreatedOnly = eventBus.getHistoryByType('FILE_CREATED');
      expect(fileCreatedOnly.length).toBe(1);

      const limited = eventBus.getHistory({ limit: 1 });
      expect(limited.length).toBe(1);
      expect(limited[0]?.type).toBe('PROCESS_STARTED');
    });

    it('clears event history', () => {
      const eventBus = new EventBus();
      eventBus.emit('USER_LOGIN', { userId: 'u1', username: 'alice' });
      expect(eventBus.getHistory().length).toBe(1);

      eventBus.clearHistory();
      expect(eventBus.getHistory().length).toBe(0);
    });
  });

  // =========================================================================
  // 9. Memory Management & Listener Cleanup
  // =========================================================================
  describe('Memory Safety & Cleanup', () => {
    it('clears listeners for a specific event type', () => {
      const eventBus = new EventBus();
      eventBus.subscribe('FILE_CREATED', () => {});
      eventBus.subscribe('FILE_DELETED', () => {});

      eventBus.clear('FILE_CREATED');

      expect(eventBus.hasSubscribers('FILE_CREATED')).toBe(false);
      expect(eventBus.hasSubscribers('FILE_DELETED')).toBe(true);
    });

    it('clears all listeners including global listeners with clearAll', () => {
      const eventBus = new EventBus();
      eventBus.subscribe('FILE_CREATED', () => {});
      eventBus.subscribeAll(() => {});

      expect(eventBus.listenerCount()).toBe(2);

      eventBus.clearAll();

      expect(eventBus.listenerCount()).toBe(0);
      expect(eventBus.hasSubscribers()).toBe(false);
    });

    it('logs a warning when listener count exceeds listenerWarningThreshold', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eventBus = new EventBus({ listenerWarningThreshold: 2 });

      eventBus.subscribe('SESSION_STARTED', () => {});
      eventBus.subscribe('SESSION_STARTED', () => {});
      expect(warnSpy).not.toHaveBeenCalled();

      eventBus.subscribe('SESSION_STARTED', () => {});
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // =========================================================================
  // 10. Statistics & Diagnostics
  // =========================================================================
  describe('Event Bus Statistics', () => {
    it('tracks total emitted events, active listeners, history size, and per-type counts', () => {
      const eventBus = new EventBus();
      eventBus.subscribe('FILE_CREATED', () => {});
      eventBus.subscribe('FILE_CREATED', () => {});
      eventBus.subscribeAll(() => {});

      eventBus.emit('FILE_CREATED', { path: '/a' });
      eventBus.emit('FILE_CREATED', { path: '/b' });
      eventBus.emit('USER_LOGIN', { userId: 'u1', username: 'carol' });

      const stats = eventBus.getStats();

      expect(stats.emittedEvents).toBe(3);
      expect(stats.activeListeners).toBe(3); // 2 on FILE_CREATED + 1 global
      expect(stats.historySize).toBe(3);
      expect(stats.eventCounts).toEqual({
        FILE_CREATED: 2,
        USER_LOGIN: 1,
      });
    });
  });

  // =========================================================================
  // 11. Kernel Service Integration
  // =========================================================================
  describe('Kernel Integration', () => {
    it('registers into Kernel as a SystemService and participates in OS lifecycle', async () => {
      const kernel = new Kernel();
      const eventBus = new EventBus();

      expect(eventBus.name).toBe('event-bus');
      kernel.registerService(eventBus);

      expect(kernel.getService<EventBus>('event-bus')).toBe(eventBus);
      expect(eventBus.getStatus()).toBe('REGISTERED');

      await kernel.initialize();
      expect(eventBus.getStatus()).toBe('INITIALIZED');

      await kernel.start();
      expect(eventBus.getStatus()).toBe('RUNNING');

      await kernel.stop();
      expect(eventBus.getStatus()).toBe('STOPPED');
    });

    it('bridges Kernel lifecycle events through attachToKernel()', async () => {
      const kernel = new Kernel();
      const eventBus = new EventBus();
      kernel.registerService(eventBus);

      const capturedEvents: string[] = [];
      eventBus.subscribeAll((event) => {
        capturedEvents.push(event.type);
      });

      const detach = eventBus.attachToKernel(kernel);

      await kernel.initialize();
      await kernel.start();
      await kernel.stop();

      expect(capturedEvents).toContain('SYSTEM_INITIALIZING');
      expect(capturedEvents).toContain('SYSTEM_INITIALIZED');
      expect(capturedEvents).toContain('SYSTEM_STARTING');
      expect(capturedEvents).toContain('SYSTEM_STARTED');
      expect(capturedEvents).toContain('SYSTEM_STOPPING');
      expect(capturedEvents).toContain('SYSTEM_STOPPED');

      detach();
    });
  });

  // =========================================================================
  // 12. Input Validation & Error Handling
  // =========================================================================
  describe('Validation & Error Handling', () => {
    it('throws InvalidEventTypeError when subscribing or emitting with empty string', () => {
      const eventBus = new EventBus();

      expect(() => eventBus.subscribe('', () => {})).toThrowError(InvalidEventTypeError);
      expect(() => eventBus.emit('', {})).toThrowError(InvalidEventTypeError);
    });

    it('throws InvalidListenerError when subscribing with non-function listener', () => {
      const eventBus = new EventBus();

      expect(() => (eventBus as any).subscribe('FILE_CREATED', null)).toThrowError(
        InvalidListenerError
      );
    });

    it('throws InvalidEventBusConfigError when initializing with negative maxHistorySize', () => {
      expect(() => new EventBus({ maxHistorySize: -5 })).toThrowError(
        InvalidEventBusConfigError
      );
    });
  });
});
