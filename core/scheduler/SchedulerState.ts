/**
 * @file SchedulerState.ts
 * @description State tracker for the Process Scheduler lifecycle.
 */

import type { SchedulerState, SchedulerStatus } from './types.js';

export class SchedulerStateTracker {
  private _status: SchedulerStatus = 'CREATED';
  private _startedAt?: number;
  private _stoppedAt?: number;
  private _pausedAt?: number;
  private _failedAt?: number;
  private _error?: Error | string;

  public getStatus(): SchedulerStatus {
    return this._status;
  }

  public getState(): SchedulerState {
    return {
      status: this._status,
      startedAt: this._startedAt,
      stoppedAt: this._stoppedAt,
      pausedAt: this._pausedAt,
      failedAt: this._failedAt,
      error: this._error,
    };
  }

  public transition(newStatus: SchedulerStatus, error?: Error | string): void {
    this._status = newStatus;
    const now = Date.now();

    if (newStatus === 'RUNNING') {
      if (!this._startedAt) this._startedAt = now;
      this._pausedAt = undefined;
    } else if (newStatus === 'PAUSED') {
      this._pausedAt = now;
    } else if (newStatus === 'STOPPED') {
      this._stoppedAt = now;
    } else if (newStatus === 'ERROR') {
      this._failedAt = now;
      this._error = error;
    }
  }

  public reset(): void {
    this._status = 'CREATED';
    this._startedAt = undefined;
    this._stoppedAt = undefined;
    this._pausedAt = undefined;
    this._failedAt = undefined;
    this._error = undefined;
  }
}
