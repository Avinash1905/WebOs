/**
 * @file StorageCompactor.ts
 * @description Storage fragmentation analyzer and tombstone garbage collection compactor.
 */

export class StorageCompactor {
  public static calculateFragmentation(totalKeys: number, tombstoneKeys: number): number {
    if (totalKeys + tombstoneKeys === 0) return 0;
    return Math.round((tombstoneKeys / (totalKeys + tombstoneKeys)) * 100);
  }

  public static compactMap<V>(source: Map<string, V>, isTombstone: (v: V) => boolean): { freedCount: number } {
    let freedCount = 0;
    for (const [k, v] of source.entries()) {
      if (isTombstone(v)) {
        source.delete(k);
        freedCount++;
      }
    }
    return { freedCount };
  }
}
