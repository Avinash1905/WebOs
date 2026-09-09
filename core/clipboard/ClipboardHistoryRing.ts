/**
 * @file ClipboardHistoryRing.ts
 * @description Circular ring buffer of clipboard history entries with favorites and search.
 */

export interface ClipboardHistoryEntry {
  readonly id: string;
  readonly text: string;
  readonly timestamp: number;
  isPinned: boolean;
}

export class ClipboardHistoryRing {
  private readonly entries: ClipboardHistoryEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  public push(text: string): ClipboardHistoryEntry {
    // Avoid immediate duplicate
    if (this.entries.length > 0 && this.entries[0]?.text === text) {
      return this.entries[0];
    }

    const entry: ClipboardHistoryEntry = {
      id: `clip_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      text,
      timestamp: Date.now(),
      isPinned: false
    };

    this.entries.unshift(entry);

    if (this.entries.length > this.capacity) {
      // Find oldest unpinned entry to evict
      for (let i = this.entries.length - 1; i >= 0; i--) {
        const item = this.entries[i];
        if (item && !item.isPinned) {
          this.entries.splice(i, 1);
          break;
        }
      }
    }

    return entry;
  }

  public pin(id: string): boolean {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.isPinned = true;
      return true;
    }
    return false;
  }

  public unpin(id: string): boolean {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.isPinned = false;
      return true;
    }
    return false;
  }

  public search(query: string): readonly ClipboardHistoryEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter(e => e.text.toLowerCase().includes(q));
  }

  public getEntries(): readonly ClipboardHistoryEntry[] {
    return Object.freeze([...this.entries]);
  }

  public clear(): void {
    this.entries.length = 0;
  }
}
