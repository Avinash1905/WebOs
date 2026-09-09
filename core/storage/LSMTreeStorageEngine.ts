/**
 * @file LSMTreeStorageEngine.ts
 * @description Log-Structured Merge (LSM) Tree storage engine with MemTable, SSTables, and compaction.
 */

export interface SSTableEntry {
  readonly key: string;
  readonly value: string;
  readonly isTombstone: boolean;
  readonly timestamp: number;
}

export class LSMTreeStorageEngine {
  private _memTable = new Map<string, SSTableEntry>();
  private readonly _ssTables: SSTableEntry[][] = []; // Level-0 SSTables
  private readonly _memTableThreshold: number;

  constructor(memTableThreshold: number = 100) {
    this._memTableThreshold = memTableThreshold;
  }

  public put(key: string, value: string): void {
    this._memTable.set(key, {
      key,
      value,
      isTombstone: false,
      timestamp: Date.now(),
    });

    if (this._memTable.size >= this._memTableThreshold) {
      this.flushMemTable();
    }
  }

  public delete(key: string): void {
    this._memTable.set(key, {
      key,
      value: '',
      isTombstone: true,
      timestamp: Date.now(),
    });
  }

  public get(key: string): string | null {
    // 1. Check active MemTable
    const inMem = this._memTable.get(key);
    if (inMem) {
      return inMem.isTombstone ? null : inMem.value;
    }

    // 2. Check SSTables from newest to oldest
    for (let i = this._ssTables.length - 1; i >= 0; i--) {
      const sstable = this._ssTables[i]!;
      const entry = sstable.find((e) => e.key === key);
      if (entry) {
        return entry.isTombstone ? null : entry.value;
      }
    }

    return null;
  }

  public flushMemTable(): void {
    if (this._memTable.size === 0) return;

    const entries = Array.from(this._memTable.values()).sort((a, b) => a.key.localeCompare(b.key));
    this._ssTables.push(entries);
    this._memTable = new Map();
  }

  public compact(): void {
    this.flushMemTable();
    const mergedMap = new Map<string, SSTableEntry>();

    for (const sstable of this._ssTables) {
      for (const entry of sstable) {
        mergedMap.set(entry.key, entry);
      }
    }

    const compacted = Array.from(mergedMap.values())
      .filter((e) => !e.isTombstone)
      .sort((a, b) => a.key.localeCompare(b.key));

    this._ssTables.length = 0;
    if (compacted.length > 0) {
      this._ssTables.push(compacted);
    }
  }

  public get sstableCount(): number {
    return this._ssTables.length;
  }
}
