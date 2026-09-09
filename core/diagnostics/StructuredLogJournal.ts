/**
 * @file StructuredLogJournal.ts
 * @description Systemd binary journal format simulation with indexed monotonic timestamps.
 */

export interface JournalEntry {
  readonly id: string;
  readonly realtimeTimestamp: number;
  readonly monotonicTimestamp: number;
  readonly priority: number; // 0 (EMERG) to 7 (DEBUG)
  readonly message: string;
  readonly fields: Record<string, string>;
}

export class StructuredLogJournal {
  private readonly _entries: JournalEntry[] = [];
  private _nextMonotonic = 1000;

  public log(priority: number, message: string, fields: Record<string, string> = {}): JournalEntry {
    const entry: JournalEntry = {
      id: `jrn_${Date.now()}_${this._entries.length}`,
      realtimeTimestamp: Date.now(),
      monotonicTimestamp: this._nextMonotonic++,
      priority,
      message,
      fields: { ...fields },
    };

    this._entries.push(entry);
    return entry;
  }

  public query(filters: { priorityMax?: number; fieldMatch?: { key: string; val: string } }): JournalEntry[] {
    return this._entries.filter((entry) => {
      if (filters.priorityMax !== undefined && entry.priority > filters.priorityMax) {
        return false;
      }
      if (filters.fieldMatch) {
        const val = entry.fields[filters.fieldMatch.key];
        if (val !== filters.fieldMatch.val) return false;
      }
      return true;
    });
  }

  public get entries(): readonly JournalEntry[] {
    return this._entries;
  }
}
