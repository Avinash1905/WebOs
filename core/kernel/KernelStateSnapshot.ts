/**
 * @file KernelStateSnapshot.ts
 * @description Point-in-time runtime state serialization and recovery checkpoints for the Kernel.
 */

import type { KernelStatus, ServiceStatus } from './types.js';

export interface ServiceStateSnapshot {
  readonly name: string;
  readonly status: ServiceStatus;
  readonly dependencies: readonly string[];
  readonly optionalDependencies: readonly string[];
}

export interface KernelCheckpoint {
  readonly checkpointId: string;
  readonly timestamp: number;
  readonly kernelStatus: KernelStatus;
  readonly services: ServiceStateSnapshot[];
  readonly metadata: Record<string, unknown>;
}

let checkpointCounter = 0;

export class KernelStateSnapshotManager {
  private readonly _checkpoints: KernelCheckpoint[] = [];
  private readonly _maxCheckpoints: number;

  constructor(maxCheckpoints = 20) {
    this._maxCheckpoints = maxCheckpoints;
  }

  public createCheckpoint(
    kernelStatus: KernelStatus,
    services: { name: string; status: ServiceStatus; dependencies: readonly string[]; optionalDependencies: readonly string[] }[],
    metadata?: Record<string, unknown>
  ): KernelCheckpoint {
    const checkpoint: KernelCheckpoint = {
      checkpointId: `chk_${Date.now()}_${++checkpointCounter}`,
      timestamp: Date.now(),
      kernelStatus,
      services: services.map((s) => ({
        name: s.name,
        status: s.status,
        dependencies: [...s.dependencies],
        optionalDependencies: [...s.optionalDependencies],
      })),
      metadata: { ...(metadata ?? {}) },
    };

    this._checkpoints.unshift(checkpoint);
    if (this._checkpoints.length > this._maxCheckpoints) {
      this._checkpoints.length = this._maxCheckpoints;
    }

    return checkpoint;
  }

  public getLatestCheckpoint(): KernelCheckpoint | undefined {
    return this._checkpoints[0];
  }

  public getCheckpoint(checkpointId: string): KernelCheckpoint | undefined {
    return this._checkpoints.find((c) => c.checkpointId === checkpointId);
  }

  public getHistory(): readonly KernelCheckpoint[] {
    return Object.freeze([...this._checkpoints]);
  }

  public clear(): void {
    this._checkpoints.length = 0;
  }
}
