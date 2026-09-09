/**
 * @file PidManager.ts
 * @description Monotonically incrementing PID allocator with safe collision checks.
 */

import { PidAllocationError } from './ProcessError.js';

export class PidManager {
  private readonly _startPid: number;
  private _nextPid: number;
  private readonly _activePids = new Set<number>();

  constructor(startPid: number = 100) {
    this._startPid = Math.max(1, startPid);
    this._nextPid = this._startPid;
  }

  /**
   * Allocates the next available unique PID.
   */
  public allocate(): number {
    const maxScan = 100000;
    let attempts = 0;

    while (attempts < maxScan) {
      const pid = this._nextPid++;
      if (this._nextPid > 999999) {
        this._nextPid = this._startPid;
      }

      if (!this._activePids.has(pid)) {
        this._activePids.add(pid);
        return pid;
      }
      attempts++;
    }

    throw new PidAllocationError('Exhausted available process ID address space');
  }

  /**
   * Releases a PID when a process is fully purged/reaped.
   */
  public release(pid: number): void {
    this._activePids.delete(pid);
  }

  /**
   * Checks if a PID is currently assigned to an active process.
   */
  public isAllocated(pid: number): boolean {
    return this._activePids.has(pid);
  }

  /**
   * Returns the count of allocated PIDs.
   */
  public count(): number {
    return this._activePids.size;
  }

  /**
   * Resets all allocated PIDs (used on OS reboot/reset).
   */
  public reset(): void {
    this._activePids.clear();
    this._nextPid = this._startPid;
  }
}
