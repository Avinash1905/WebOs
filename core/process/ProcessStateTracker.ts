/**
 * @file ProcessStateTracker.ts
 * @description Validates state transitions for WebOS process lifecycle.
 */

import { InvalidProcessStateError } from './ProcessError.js';
import type { ProcessState } from './types.js';

/**
 * Permitted process lifecycle state transitions.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<ProcessState, readonly ProcessState[]>> = {
  CREATED: ['READY', 'RUNNING', 'TERMINATED', 'FAILED'],
  READY: ['RUNNING', 'TERMINATED', 'FAILED'],
  RUNNING: ['PAUSED', 'WAITING', 'TERMINATED', 'FAILED'],
  PAUSED: ['RUNNING', 'READY', 'TERMINATED', 'FAILED'],
  WAITING: ['RUNNING', 'READY', 'TERMINATED', 'FAILED'],
  TERMINATED: [], // Terminal state
  FAILED: [],     // Terminal state
};

export class ProcessStateTracker {
  /**
   * Checks if a transition from currentState to targetState is valid.
   */
  public static canTransition(from: ProcessState, to: ProcessState): boolean {
    if (from === to) return true;
    const allowed = ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Validates a transition, throwing InvalidProcessStateError if disallowed.
   */
  public static validateTransition(
    pid: number,
    from: ProcessState,
    to: ProcessState
  ): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidProcessStateError(
        pid,
        from,
        to,
        from === 'TERMINATED' || from === 'FAILED'
          ? `Process is in terminal state '${from}' and cannot be resumed or restarted directly`
          : undefined
      );
    }
  }
}
