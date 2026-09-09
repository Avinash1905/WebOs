/**
 * @file KernelState.ts
 * @description State machine and runtime status tracker for the WebOS Kernel.
 */

import { InvalidKernelStateError } from './KernelError.js';
import type { KernelStateSnapshot, KernelStatus } from './types.js';

/**
 * Valid state transitions map for the Kernel state machine.
 */
const VALID_TRANSITIONS: Record<KernelStatus, readonly KernelStatus[]> = {
  CREATED: ['INITIALIZING', 'STARTING', 'FAILED'],
  INITIALIZING: ['INITIALIZED', 'FAILED'],
  INITIALIZED: ['STARTING', 'INITIALIZING', 'STOPPING', 'STOPPED', 'FAILED', 'CREATED'],
  STARTING: ['RUNNING', 'STOPPING', 'FAILED'],
  RUNNING: ['STOPPING', 'FAILED'],
  STOPPING: ['STOPPED', 'FAILED'],
  STOPPED: ['INITIALIZING', 'STARTING', 'CREATED', 'FAILED'],
  FAILED: ['INITIALIZING', 'STARTING', 'STOPPING', 'STOPPED', 'CREATED'],
};

/**
 * Manages the Kernel lifecycle state machine, validation, and historical timestamps.
 */
export class KernelState {
  private _status: KernelStatus = 'CREATED';
  private _startedAt?: number;
  private _stoppedAt?: number;
  private _failedAt?: number;
  private _error?: Error;

  /**
   * Gets the current KernelStatus.
   */
  public get status(): KernelStatus {
    return this._status;
  }

  /**
   * Gets the timestamp when the Kernel transitioned to RUNNING.
   */
  public get startedAt(): number | undefined {
    return this._startedAt;
  }

  /**
   * Gets the timestamp when the Kernel transitioned to STOPPED.
   */
  public get stoppedAt(): number | undefined {
    return this._stoppedAt;
  }

  /**
   * Gets the timestamp when the Kernel transitioned to FAILED.
   */
  public get failedAt(): number | undefined {
    return this._failedAt;
  }

  /**
   * Gets the error associated with a FAILED state.
   */
  public get error(): Error | undefined {
    return this._error;
  }

  /**
   * Validates and transitions the Kernel to a new lifecycle status.
   *
   * @param targetStatus - The desired target KernelStatus.
   * @param action - Descriptive action triggering the transition (used for error reporting).
   * @throws {InvalidKernelStateError} If the transition is illegal from the current status.
   */
  public transitionTo(targetStatus: KernelStatus, action: string): void {
    if (this._status === targetStatus) {
      return;
    }

    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new InvalidKernelStateError(this._status, action);
    }

    this._status = targetStatus;

    if (targetStatus === 'RUNNING') {
      this._startedAt = Date.now();
      this._error = undefined;
    } else if (targetStatus === 'STOPPED') {
      this._stoppedAt = Date.now();
    }
  }

  /**
   * Marks the Kernel as FAILED with an associated error.
   *
   * @param error - The error causing the failure.
   */
  public fail(error: Error): void {
    this._status = 'FAILED';
    this._failedAt = Date.now();
    this._error = error;
  }

  /**
   * Resets the Kernel state back to CREATED or INITIALIZED.
   */
  public reset(status: KernelStatus = 'CREATED'): void {
    this._status = status;
    this._startedAt = undefined;
    this._stoppedAt = undefined;
    this._failedAt = undefined;
    this._error = undefined;
  }

  /**
   * Returns an immutable snapshot of the current state.
   */
  public toSnapshot(): KernelStateSnapshot {
    return {
      status: this._status,
      startedAt: this._startedAt,
      stoppedAt: this._stoppedAt,
      failedAt: this._failedAt,
      error: this._error,
    };
  }
}
