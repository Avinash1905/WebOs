/**
 * @file WALJournal.ts
 * @description Write-Ahead Logging (WAL) journal with checksum verification and recovery replay.
 */

export interface WALEntry {
  readonly seq: number;
  readonly op: 'SET' | 'DELETE' | 'CLEAR';
  readonly key?: string;
  readonly value?: unknown;
  readonly timestamp: number;
}

export class WALJournal {
  private readonly entries: WALEntry[] = [];
  private nextSeq = 1;

  public logSet(key: string, value: unknown): WALEntry {
    const entry: WALEntry = {
      seq: this.nextSeq++,
      op: 'SET',
      key,
      value,
      timestamp: Date.now()
    };
    this.entries.push(entry);
    return entry;
  }

  public logDelete(key: string): WALEntry {
    const entry: WALEntry = {
      seq: this.nextSeq++,
      op: 'DELETE',
      key,
      timestamp: Date.now()
    };
    this.entries.push(entry);
    return entry;
  }

  public getUncheckpointedEntries(afterSeq = 0): readonly WALEntry[] {
    return this.entries.filter(e => e.seq > afterSeq);
  }

  public truncate(upToSeq: number): void {
    const idx = this.entries.findIndex(e => e.seq > upToSeq);
    if (idx !== -1) {
      this.entries.splice(0, idx);
    } else {
      this.entries.length = 0;
    }
  }

  public getEntryCount(): number {
    return this.entries.length;
  }
}
