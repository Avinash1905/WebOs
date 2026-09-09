/**
 * @file Scheduler.ts
 * @description WebOS Process Scheduler coordinating process queues, time-slicing,
 * priority round-robin execution, metrics, and lifecycle events.
 */

import type { EventBus } from '../events/index.js';
import { BaseSystemService } from '../kernel/index.js';
import type { Process, ProcessManager, ProcessPriority } from '../process/index.js';
import type { StorageEngine } from '../storage/index.js';
import { ProcessQueue } from './ProcessQueue.js';
import { ProcessTimeSlice } from './ProcessTimeSlice.js';
import {
  InvalidSchedulerStateError,
  ProcessNotScheduledError,
  ProcessSchedulingError,
} from './SchedulerError.js';
import { SchedulerMetricsTracker } from './SchedulerMetrics.js';
import { SchedulerStateTracker } from './SchedulerState.js';
import { resolveSchedulerConfig } from './SchedulerConfig.js';
import { PriorityRoundRobinPolicy, type SchedulingPolicy } from './SchedulingPolicy.js';
import type {
  ProcessSchedulingInfo,
  ResolvedSchedulerConfig,
  SchedulerConfig,
  SchedulerMetrics,
  SchedulerState,
} from './types.js';

export class Scheduler extends BaseSystemService {
  public override readonly name = 'scheduler';
  public override readonly dependencies: readonly string[] = ['process-manager'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'storage',
  ];

  private readonly _config: ResolvedSchedulerConfig;
  private readonly _stateTracker = new SchedulerStateTracker();
  private readonly _queue = new ProcessQueue();
  private readonly _policy: SchedulingPolicy = new PriorityRoundRobinPolicy();
  private readonly _timeSlice: ProcessTimeSlice;
  private readonly _metricsTracker = new SchedulerMetricsTracker();

  private _processManager?: ProcessManager;
  private _eventBus?: EventBus;
  private _storageEngine?: StorageEngine;

  private readonly _scheduledProcesses = new Map<number, ProcessSchedulingInfo>();
  private _runningProcessPid: number | null = null;
  private _autoTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: SchedulerConfig) {
    super();
    this._config = resolveSchedulerConfig(config);
    this._timeSlice = new ProcessTimeSlice(this._config);

    this._processManager = config?.processManager;
    this._eventBus = config?.eventBus;

    if (config?.storage) {
      this.attachStorage(config.storage);
    }
  }

  // =========================================================================
  // Service Attachments & Integrations
  // =========================================================================

  public attachProcessManager(processManager: ProcessManager): void {
    this._processManager = processManager;
  }

  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
  }

  // =========================================================================
  // Service Lifecycle Hooks
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    if (this._storageEngine) {
      await this._storageEngine.initialize();
    }
    this._stateTracker.transition('INITIALIZED');
  }

  protected override async onStart(): Promise<void> {
    this._stateTracker.transition('RUNNING');
    this._metricsTracker.start();

    if (this._eventBus) {
      this._eventBus.emit('SCHEDULER_STARTED', {
        status: 'RUNNING',
        timestamp: Date.now(),
      });
    }

    if (this._config.autoStep) {
      this.startAutoLoop();
    }
  }

  protected override async onStop(): Promise<void> {
    this.stopAutoLoop();

    // Pause or clear running processes
    if (this._runningProcessPid !== null) {
      const running = this._scheduledProcesses.get(this._runningProcessPid);
      if (running && running.state === 'RUNNING') {
        running.state = 'PAUSED';
      }
      this._runningProcessPid = null;
    }

    this._stateTracker.transition('STOPPED');
    this._metricsTracker.stop();

    if (this._eventBus) {
      this._eventBus.emit('SCHEDULER_STOPPED', {
        status: 'STOPPED',
        timestamp: Date.now(),
      });
    }
  }

  public async pause(): Promise<void> {
    this.stopAutoLoop();
    this._stateTracker.transition('PAUSED');

    if (this._eventBus) {
      this._eventBus.emit('SCHEDULER_PAUSED', {
        status: 'PAUSED',
        timestamp: Date.now(),
      });
    }
  }

  public async resume(): Promise<void> {
    this._stateTracker.transition('RUNNING');

    if (this._eventBus) {
      this._eventBus.emit('SCHEDULER_RESUMED', {
        status: 'RUNNING',
        timestamp: Date.now(),
      });
    }

    if (this._config.autoStep) {
      this.startAutoLoop();
    }
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  protected override async onReset(): Promise<void> {
    this.stopAutoLoop();
    this._queue.clear();
    this._scheduledProcesses.clear();
    this._runningProcessPid = null;
    this._metricsTracker.reset();
    this._stateTracker.reset();
  }

  // =========================================================================
  // Process Scheduling API
  // =========================================================================

  /**
   * Enqueues a process into the scheduler ready queue.
   */
  public startProcessScheduling(
    pid: number,
    options?: { priority?: ProcessPriority }
  ): ProcessSchedulingInfo {
    const status = this._stateTracker.getStatus();
    if (status !== 'RUNNING' && status !== 'INITIALIZED') {
      throw new InvalidSchedulerStateError(status, 'RUNNING', 'startProcessScheduling');
    }

    let process: Process | undefined;
    if (this._processManager) {
      process = this._processManager.getProcess(pid) ?? undefined;
      if (!process) {
        throw new ProcessSchedulingError(pid, 'Process does not exist in ProcessManager');
      }
      if (process.state === 'TERMINATED') {
        throw new ProcessSchedulingError(pid, 'Cannot schedule a terminated process');
      }
    }

    const priority = options?.priority ?? process?.priority ?? 'NORMAL';
    const timeSliceMs = this._timeSlice.calculateSlice(priority);
    const now = Date.now();

    const existing = this._scheduledProcesses.get(pid);
    if (existing) {
      existing.priority = priority;
      existing.timeSliceMs = timeSliceMs;
      existing.remainingSliceMs = timeSliceMs;
      existing.state = 'READY';
      this._queue.enqueue(existing);
      return existing;
    }

    const info: ProcessSchedulingInfo = {
      pid,
      priority,
      timeSliceMs,
      remainingSliceMs: timeSliceMs,
      totalCpuTimeMs: 0,
      enqueuedAt: now,
      state: 'READY',
    };

    this._scheduledProcesses.set(pid, info);
    this._queue.enqueue(info);
    this._metricsTracker.recordScheduled();

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_SCHEDULED', {
        pid,
        priority,
        timeSliceMs,
      });
    }

    return info;
  }

  /**
   * Removes a process from the scheduler.
   */
  public stopProcessScheduling(pid: number): void {
    const info = this._scheduledProcesses.get(pid);
    if (!info) return;

    this._queue.remove(pid);
    info.state = 'TERMINATED';
    this._scheduledProcesses.delete(pid);

    if (this._runningProcessPid === pid) {
      this._runningProcessPid = null;
      this._metricsTracker.recordTerminated();
    }

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_COMPLETED', {
        pid,
        exitCode: 0,
      });
    }
  }

  /**
   * Pauses scheduling for a specific process.
   */
  public pauseProcessScheduling(pid: number): void {
    const info = this._scheduledProcesses.get(pid);
    if (!info) {
      throw new ProcessNotScheduledError(pid);
    }

    this._queue.remove(pid);
    info.state = 'PAUSED';

    if (this._runningProcessPid === pid) {
      this._runningProcessPid = null;
    }
  }

  /**
   * Resumes a paused process and returns it to the ready queue.
   */
  public resumeProcessScheduling(pid: number): void {
    const info = this._scheduledProcesses.get(pid);
    if (!info) {
      throw new ProcessNotScheduledError(pid);
    }

    if (info.state === 'PAUSED') {
      info.state = 'READY';
      this._queue.enqueue(info);
    }
  }

  /**
   * Updates the scheduling priority of a process.
   */
  public setProcessPriority(pid: number, priority: ProcessPriority): void {
    const info = this._scheduledProcesses.get(pid);
    if (!info) {
      throw new ProcessNotScheduledError(pid);
    }

    const oldPriority = info.priority;
    if (oldPriority === priority) return;

    info.priority = priority;
    info.timeSliceMs = this._timeSlice.calculateSlice(priority);
    info.remainingSliceMs = info.timeSliceMs;

    if (this._queue.has(pid)) {
      this._queue.remove(pid);
      this._queue.enqueue(info);
    }

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_PRIORITY_CHANGED', {
        pid,
        oldPriority,
        newPriority: priority,
      });
    }
  }

  /**
   * Executes a single scheduling step (dispatches the next process from the queue).
   */
  public step(): Process | null {
    if (this._stateTracker.getStatus() !== 'RUNNING') {
      return null;
    }

    // 1. Anti-starvation aging check
    if (this._config.enableAging) {
      this._queue.applyAging(this._config.agingThresholdMs);
    }

    // 2. Preempt currently running process if it exists
    if (this._runningProcessPid !== null) {
      const running = this._scheduledProcesses.get(this._runningProcessPid);
      if (running && running.state === 'RUNNING') {
        running.state = 'READY';
        running.remainingSliceMs = running.timeSliceMs;
        this._queue.requeue(running);

        if (this._eventBus) {
          this._eventBus.emit('PROCESS_PREEMPTED', {
            pid: running.pid,
            reason: 'TIME_SLICE_EXPIRED',
          });
        }
      }
      this._runningProcessPid = null;
    }

    // 3. Dequeue next candidate process
    const next = this._policy.selectNext(this._queue);
    if (!next) {
      this._metricsTracker.recordContextSwitch(null);
      return null;
    }

    // 4. Verify process in ProcessManager (if attached)
    let proc: Process | undefined;
    if (this._processManager) {
      proc = this._processManager.getProcess(next.pid) ?? undefined;
      if (!proc || proc.state === 'TERMINATED') {
        // Drop dead process
        this._scheduledProcesses.delete(next.pid);
        this._metricsTracker.recordTerminated();
        return this.step(); // Try next
      }
    }

    // 5. Switch to candidate
    next.state = 'RUNNING';
    next.lastRunAt = Date.now();
    this._runningProcessPid = next.pid;

    this._metricsTracker.recordContextSwitch(next.pid);
    this._metricsTracker.recordExecution(next.timeSliceMs);

    return proc ?? ({
      pid: next.pid,
      id: `proc_${next.pid}`,
      name: `Process-${next.pid}`,
      applicationId: 'app.webos.process',
      userId: 'system',
      state: 'RUNNING',
      priority: next.priority,
      createdAt: next.enqueuedAt,
      cwd: '/',
      env: {},
    } as Process);
  }

  // =========================================================================
  // Query & Diagnostic APIs
  // =========================================================================

  public isProcessScheduled(pid: number): boolean {
    return this._scheduledProcesses.has(pid);
  }

  public getScheduledProcesses(): Process[] {
    const pids = Array.from(this._scheduledProcesses.keys());
    if (this._processManager) {
      return pids
        .map((pid) => this._processManager?.getProcess(pid))
        .filter((p): p is Process => p !== undefined);
    }
    return pids.map(
      (pid) =>
        ({
          pid,
          id: `proc_${pid}`,
          name: `Process-${pid}`,
          applicationId: 'app.webos.process',
          userId: 'system',
          state: this._scheduledProcesses.get(pid)?.state ?? 'READY',
          priority: this._scheduledProcesses.get(pid)?.priority ?? 'NORMAL',
          createdAt: Date.now(),
          cwd: '/',
          env: {},
        } as unknown as Process)
    );
  }

  public getRunningProcess(): Process | null {
    if (this._runningProcessPid === null) return null;
    if (this._processManager) {
      return this._processManager.getProcess(this._runningProcessPid) ?? null;
    }
    return null;
  }

  public getReadyQueue(): Process[] {
    const queueEntries = this._queue.getAll();
    if (this._processManager) {
      return queueEntries
        .map((entry) => this._processManager?.getProcess(entry.pid))
        .filter((p): p is Process => p !== undefined);
    }
    return [];
  }

  public getSchedulerState(): SchedulerState {
    return this._stateTracker.getState();
  }

  public getSchedulerMetrics(): SchedulerMetrics {
    return this._metricsTracker.getMetrics(this._queue.size());
  }

  // =========================================================================
  // Timer Loop (Auto Step)
  // =========================================================================

  public startAutoLoop(): void {
    if (this._autoTimer) return;
    this._autoTimer = setInterval(() => {
      this.step();
    }, this._config.stepIntervalMs);
  }

  public stopAutoLoop(): void {
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
      this._autoTimer = null;
    }
  }
}
