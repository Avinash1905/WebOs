/**
 * @file StorageSnapshotEngine.ts
 * @description Point-in-time point recovery and delta snapshot generator.
 */

export interface StorageSnapshot {
  readonly snapshotId: string;
  readonly label: string;
  readonly data: ReadonlyMap<string, unknown>;
  readonly timestamp: number;
}

export class StorageSnapshotEngine {
  private readonly snapshots = new Map<string, StorageSnapshot>();

  public createSnapshot(label: string, liveData: Map<string, unknown>): StorageSnapshot {
    const snapshotId = `snap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const snapshot: StorageSnapshot = {
      snapshotId,
      label,
      data: new Map(liveData),
      timestamp: Date.now()
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  public restoreSnapshot(snapshotId: string): Map<string, unknown> | undefined {
    const snap = this.snapshots.get(snapshotId);
    return snap ? new Map(snap.data) : undefined;
  }

  public listSnapshots(): readonly { id: string; label: string; timestamp: number }[] {
    return Array.from(this.snapshots.values()).map(s => ({
      id: s.snapshotId,
      label: s.label,
      timestamp: s.timestamp
    }));
  }
}
