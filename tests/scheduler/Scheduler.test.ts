import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { ProcessManager } from '../../core/process/index.js';
import {
  InvalidSchedulerStateError,
  ProcessQueue,
  ProcessSchedulingError,
  Scheduler,
} from '../../core/scheduler/index.js';

describe('Process Scheduler Subsystem', () => {
  describe('Scheduler Lifecycle', () => {
    it('initializes, starts, pauses, resumes, and stops cleanly', async () => {
      const eventBus = new EventBus();
      const emitted: string[] = [];
      eventBus.subscribeAll((e) => {
        emitted.push(e.type);
      });

      const scheduler = new Scheduler({ eventBus });
      expect(scheduler.getSchedulerState().status).toBe('CREATED');

      await scheduler.initialize();
      expect(scheduler.getSchedulerState().status).toBe('INITIALIZED');

      await scheduler.start();
      expect(scheduler.getSchedulerState().status).toBe('RUNNING');
      expect(emitted).toContain('SCHEDULER_STARTED');

      await scheduler.pause();
      expect(scheduler.getSchedulerState().status).toBe('PAUSED');
      expect(emitted).toContain('SCHEDULER_PAUSED');

      await scheduler.resume();
      expect(scheduler.getSchedulerState().status).toBe('RUNNING');
      expect(emitted).toContain('SCHEDULER_RESUMED');

      await scheduler.stop();
      expect(scheduler.getSchedulerState().status).toBe('STOPPED');
      expect(emitted).toContain('SCHEDULER_STOPPED');
    });

    it('rejects process scheduling when not running or initialized', () => {
      const scheduler = new Scheduler();
      expect(() => scheduler.startProcessScheduling(100)).toThrow(
        InvalidSchedulerStateError
      );
    });
  });

  describe('Priority-Based Queueing & Round-Robin Scheduling', () => {
    it('dispatches higher priority processes before lower priority ones', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const pLow = await procManager.createProcess({ name: 'LowTask', priority: 'LOW' });
      const pNorm = await procManager.createProcess({ name: 'NormTask', priority: 'NORMAL' });
      const pCrit = await procManager.createProcess({ name: 'CritTask', priority: 'CRITICAL' });
      const pHigh = await procManager.createProcess({ name: 'HighTask', priority: 'HIGH' });

      const scheduler = new Scheduler({ processManager: procManager });
      await scheduler.initialize();
      await scheduler.start();

      scheduler.startProcessScheduling(pLow.pid, { priority: 'LOW' });
      scheduler.startProcessScheduling(pNorm.pid, { priority: 'NORMAL' });
      scheduler.startProcessScheduling(pCrit.pid, { priority: 'CRITICAL' });
      scheduler.startProcessScheduling(pHigh.pid, { priority: 'HIGH' });

      expect(scheduler.getReadyQueue().length).toBe(4);

      // Step 1: CRITICAL process
      const run1 = scheduler.step();
      expect(run1?.pid).toBe(pCrit.pid);
      expect(scheduler.getRunningProcess()?.pid).toBe(pCrit.pid);

      // Step 2: Preempt CRITICAL -> dispatch HIGH
      const run2 = scheduler.step();
      expect(run2?.pid).toBe(pHigh.pid);

      // Step 3: Preempt HIGH -> dispatch NORMAL
      const run3 = scheduler.step();
      expect(run3?.pid).toBe(pNorm.pid);

      // Step 4: Preempt NORMAL -> dispatch LOW
      const run4 = scheduler.step();
      expect(run4?.pid).toBe(pLow.pid);

      // Step 5: Wrap around back to CRITICAL
      const run5 = scheduler.step();
      expect(run5?.pid).toBe(pCrit.pid);
    });

    it('executes round-robin fair ordering among equal priority processes', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const p1 = await procManager.createProcess({ name: 'Task1', priority: 'NORMAL' });
      const p2 = await procManager.createProcess({ name: 'Task2', priority: 'NORMAL' });
      const p3 = await procManager.createProcess({ name: 'Task3', priority: 'NORMAL' });

      const scheduler = new Scheduler({ processManager: procManager });
      await scheduler.initialize();
      await scheduler.start();

      scheduler.startProcessScheduling(p1.pid);
      scheduler.startProcessScheduling(p2.pid);
      scheduler.startProcessScheduling(p3.pid);

      expect(scheduler.step()?.pid).toBe(p1.pid);
      expect(scheduler.step()?.pid).toBe(p2.pid);
      expect(scheduler.step()?.pid).toBe(p3.pid);
      expect(scheduler.step()?.pid).toBe(p1.pid);
    });

    it('dynamically changes process priority and updates queue bucket', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const p1 = await procManager.createProcess({ name: 'Task1', priority: 'LOW' });
      const p2 = await procManager.createProcess({ name: 'Task2', priority: 'HIGH' });

      const scheduler = new Scheduler({ processManager: procManager });
      await scheduler.initialize();
      await scheduler.start();

      scheduler.startProcessScheduling(p1.pid, { priority: 'LOW' });
      scheduler.startProcessScheduling(p2.pid, { priority: 'HIGH' });

      // Promote p1 from LOW to CRITICAL
      scheduler.setProcessPriority(p1.pid, 'CRITICAL');

      // Now p1 is scheduled before p2
      expect(scheduler.step()?.pid).toBe(p1.pid);
    });
  });

  describe('Anti-Starvation Aging', () => {
    it('promotes starved processes in lower priority buckets', () => {
      const queue = new ProcessQueue();
      const now = Date.now();

      queue.enqueue({
        pid: 101,
        priority: 'IDLE',
        timeSliceMs: 10,
        remainingSliceMs: 10,
        totalCpuTimeMs: 0,
        enqueuedAt: now - 10000, // 10s ago
        state: 'READY',
      });

      const promoted = queue.applyAging(5000);
      expect(promoted).toBe(1);

      const next = queue.dequeue();
      expect(next?.pid).toBe(101);
      expect(next?.priority).toBe('LOW'); // Promoted from IDLE to LOW
    });
  });

  describe('Metrics and EventBus Emissions', () => {
    it('tracks context switches, total scheduled, and uptime accurately', async () => {
      const eventBus = new EventBus();
      const emitted: string[] = [];
      eventBus.subscribeAll((e) => {
        emitted.push(e.type);
      });

      const procManager = new ProcessManager({ eventBus });
      await procManager.initialize();

      const p1 = await procManager.createProcess({ name: 'App1' });
      const p2 = await procManager.createProcess({ name: 'App2' });

      const scheduler = new Scheduler({ processManager: procManager, eventBus });
      await scheduler.initialize();
      await scheduler.start();

      scheduler.startProcessScheduling(p1.pid);
      scheduler.startProcessScheduling(p2.pid);

      expect(emitted).toContain('PROCESS_SCHEDULED');

      scheduler.step();
      scheduler.step();

      const metrics = scheduler.getSchedulerMetrics();
      expect(metrics.totalScheduled).toBe(2);
      expect(metrics.contextSwitches).toBeGreaterThanOrEqual(2);
      expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0);

      scheduler.stopProcessScheduling(p1.pid);
      expect(emitted).toContain('PROCESS_COMPLETED');
      expect(scheduler.isProcessScheduled(p1.pid)).toBe(false);
    });

    it('rejects scheduling terminated processes', async () => {
      const procManager = new ProcessManager();
      await procManager.initialize();

      const p = await procManager.createProcess({ name: 'DeadTask' });
      await procManager.terminateProcess(p.pid);

      const scheduler = new Scheduler({ processManager: procManager });
      await scheduler.initialize();
      await scheduler.start();

      expect(() => scheduler.startProcessScheduling(p.pid)).toThrow(
        ProcessSchedulingError
      );
    });
  });
});
