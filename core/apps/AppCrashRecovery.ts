/**
 * @file AppCrashRecovery.ts
 * @description State checkpointing and automated application crash recovery.
 */

export interface AppCheckpoint {
  readonly appId: string;
  readonly timestamp: number;
  readonly stateData: Readonly<Record<string, unknown>>;
}

export class AppCrashRecovery {
  private readonly checkpoints = new Map<string, AppCheckpoint>();
  private readonly crashCounts = new Map<string, { count: number; lastCrash: number }>();
  private readonly maxCrashesBeforeLockout = 3;
  private readonly lockoutWindowMs = 60000; // 1 minute

  public saveCheckpoint(appId: string, stateData: Record<string, unknown>): AppCheckpoint {
    const checkpoint: AppCheckpoint = {
      appId,
      timestamp: Date.now(),
      stateData: Object.freeze({ ...stateData })
    };
    this.checkpoints.set(appId, checkpoint);
    return checkpoint;
  }

  public getCheckpoint(appId: string): AppCheckpoint | undefined {
    return this.checkpoints.get(appId);
  }

  public recordCrash(appId: string): { canAutoRestart: boolean; currentCrashCount: number } {
    const now = Date.now();
    const existing = this.crashCounts.get(appId);

    if (!existing || now - existing.lastCrash > this.lockoutWindowMs) {
      this.crashCounts.set(appId, { count: 1, lastCrash: now });
      return { canAutoRestart: true, currentCrashCount: 1 };
    }

    existing.count++;
    existing.lastCrash = now;

    const canAutoRestart = existing.count <= this.maxCrashesBeforeLockout;
    return { canAutoRestart, currentCrashCount: existing.count };
  }

  public resetCrashCount(appId: string): void {
    this.crashCounts.delete(appId);
  }
}
