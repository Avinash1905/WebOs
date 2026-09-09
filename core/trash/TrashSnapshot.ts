/**
 * @file TrashSnapshot.ts
 * @description Batch deletion tracking and rollback restore points.
 */

import type { TrashManager } from './TrashManager.js';

export interface BatchRestorePoint {
  readonly batchId: string;
  readonly createdAt: number;
  readonly label: string;
  readonly trashIds: readonly string[];
}

export class TrashSnapshot {
  private readonly snapshots = new Map<string, BatchRestorePoint>();

  public createSnapshot(label: string, trashIds: string[]): BatchRestorePoint {
    const batchId = `snap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const point: BatchRestorePoint = {
      batchId,
      createdAt: Date.now(),
      label,
      trashIds: Object.freeze([...trashIds])
    };
    this.snapshots.set(batchId, point);
    return point;
  }

  public getSnapshot(batchId: string): BatchRestorePoint | undefined {
    return this.snapshots.get(batchId);
  }

  public async restoreSnapshot(batchId: string, trashManager: TrashManager): Promise<{ restoredCount: number; failedCount: number }> {
    const snap = this.snapshots.get(batchId);
    if (!snap) throw new Error(`Snapshot ${batchId} not found`);

    let restoredCount = 0;
    let failedCount = 0;

    for (const id of snap.trashIds) {
      try {
        await trashManager.restore(id);
        restoredCount++;
      } catch {
        failedCount++;
      }
    }

    return { restoredCount, failedCount };
  }

  public listSnapshots(): readonly BatchRestorePoint[] {
    return Array.from(this.snapshots.values());
  }
}
