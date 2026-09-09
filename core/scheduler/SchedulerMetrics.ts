/**
 * @file SchedulerMetrics.ts
 * @description Metrics and diagnostic telemetry tracker for the Process Scheduler.
 */

import type { SchedulerMetrics } from './types.js';

export class SchedulerMetricsTracker {
  private _totalScheduled = 0;
  private _currentlyRunningPid: number | null = null;
  private _completedProcesses = 0;
  private _terminatedProcesses = 0;
  private _failedProcesses = 0;
  private _contextSwitches = 0;
  private _startedAt: number | null = null;
  private _totalExecutionTimeMs = 0;
  private _executionCount = 0;

  public start(): void {
    this._startedAt = Date.now();
  }

  public stop(): void {
    this._currentlyRunningPid = null;
  }

  public reset(): void {
    this._totalScheduled = 0;
    this._currentlyRunningPid = null;
    this._completedProcesses = 0;
    this._terminatedProcesses = 0;
    this._failedProcesses = 0;
    this._contextSwitches = 0;
    this._startedAt = Date.now();
    this._totalExecutionTimeMs = 0;
    this._executionCount = 0;
  }

  public recordScheduled(): void {
    this._totalScheduled++;
  }

  public recordContextSwitch(newPid: number | null): void {
    if (newPid !== this._currentlyRunningPid) {
      this._contextSwitches++;
      this._currentlyRunningPid = newPid;
    }
  }

  public recordExecution(durationMs: number): void {
    this._totalExecutionTimeMs += durationMs;
    this._executionCount++;
  }

  public recordCompleted(): void {
    this._completedProcesses++;
    this._currentlyRunningPid = null;
  }

  public recordTerminated(): void {
    this._terminatedProcesses++;
    this._currentlyRunningPid = null;
  }

  public recordFailed(): void {
    this._failedProcesses++;
    this._currentlyRunningPid = null;
  }

  public getMetrics(readyQueueSize: number): SchedulerMetrics {
    const now = Date.now();
    const uptimeMs = this._startedAt ? now - this._startedAt : 0;
    const avgExecutionTimeMs =
      this._executionCount > 0 ? this._totalExecutionTimeMs / this._executionCount : 0;

    return {
      totalScheduled: this._totalScheduled,
      currentlyRunningPid: this._currentlyRunningPid,
      readyQueueSize,
      completedProcesses: this._completedProcesses,
      terminatedProcesses: this._terminatedProcesses,
      failedProcesses: this._failedProcesses,
      contextSwitches: this._contextSwitches,
      uptimeMs,
      totalExecutionTimeMs: this._totalExecutionTimeMs,
      avgExecutionTimeMs: Math.round(avgExecutionTimeMs * 100) / 100,
    };
  }
}
