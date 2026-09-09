/**
 * WebOS Database Engine - Multi-Version Concurrency Control (MVCC)
 * Implements Snapshot Isolation and row version tuples (xmin, xmax).
 */

export interface MVCCRowTuple<T = Record<string, any>> {
  id: string | number;
  xmin: number; // Transaction ID that created this version
  xmax: number | null; // Transaction ID that deleted/superseded this version (null if live)
  data: T;
  createdAt: number;
}

export class MVCCManager<T extends Record<string, any> = Record<string, any>> {
  private rows: Map<string | number, MVCCRowTuple<T>[]> = new Map();
  private globalTxCounter: number = 100;

  public nextTxId(): number {
    return ++this.globalTxCounter;
  }

  public insert(id: string | number, data: T, txId: number): void {
    const tuple: MVCCRowTuple<T> = {
      id,
      xmin: txId,
      xmax: null,
      data,
      createdAt: Date.now(),
    };

    const versions = this.rows.get(id) || [];
    versions.push(tuple);
    this.rows.set(id, versions);
  }

  public update(id: string | number, updatedData: T, txId: number): void {
    const versions = this.rows.get(id);
    if (!versions || versions.length === 0) {
      throw new Error(`Row #${id} does not exist`);
    }

    // Mark current active version as superseded by txId
    const currentActive = versions.find((v) => v.xmax === null);
    if (currentActive) {
      currentActive.xmax = txId;
    }

    // Insert new version
    const newVersion: MVCCRowTuple<T> = {
      id,
      xmin: txId,
      xmax: null,
      data: { ...(currentActive?.data || {}), ...updatedData },
      createdAt: Date.now(),
    };
    versions.push(newVersion);
  }

  public delete(id: string | number, txId: number): boolean {
    const versions = this.rows.get(id);
    if (!versions) return false;

    const currentActive = versions.find((v) => v.xmax === null);
    if (currentActive) {
      currentActive.xmax = txId;
      return true;
    }
    return false;
  }

  public readSnapshot(id: string | number, snapshotTxId: number): T | null {
    const versions = this.rows.get(id);
    if (!versions) return null;

    // Visible if xmin <= snapshotTxId AND (xmax is null OR xmax > snapshotTxId)
    const visibleTuple = versions.find(
      (v) => v.xmin <= snapshotTxId && (v.xmax === null || v.xmax > snapshotTxId)
    );

    return visibleTuple ? visibleTuple.data : null;
  }

  public scanSnapshot(snapshotTxId: number): T[] {
    const results: T[] = [];
    for (const id of this.rows.keys()) {
      const row = this.readSnapshot(id, snapshotTxId);
      if (row) results.push(row);
    }
    return results;
  }
}
