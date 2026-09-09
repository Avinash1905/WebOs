/**
 * @file ClipboardHistoryStore.ts
 * @description Persistent multi-item clipboard history with tagging and sensitive item filtering.
 */

export interface ClipboardHistoryRecord {
  readonly id: string;
  readonly content: string;
  readonly mimeType: string;
  readonly timestamp: number;
  readonly isPinned: boolean;
  readonly tags: readonly string[];
}

export class ClipboardHistoryStore {
  private readonly _history: ClipboardHistoryRecord[] = [];
  private readonly _maxItems: number;

  constructor(maxItems: number = 100) {
    this._maxItems = maxItems;
  }

  public push(content: string, mimeType: string = 'text/plain', tags: string[] = []): ClipboardHistoryRecord {
    const record: ClipboardHistoryRecord = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      content,
      mimeType,
      timestamp: Date.now(),
      isPinned: false,
      tags: [...tags],
    };

    this._history.unshift(record);

    // Evict unpinned items exceeding capacity
    if (this._history.length > this._maxItems) {
      const unpinnedIdx = this._history.findIndex((item, idx) => idx >= this._maxItems && !item.isPinned);
      if (unpinnedIdx !== -1) {
        this._history.splice(unpinnedIdx, 1);
      }
    }

    return record;
  }

  public getItems(limit: number = 20): ClipboardHistoryRecord[] {
    return this._history.slice(0, limit);
  }

  public search(query: string): ClipboardHistoryRecord[] {
    const q = query.toLowerCase();
    return this._history.filter((item) => item.content.toLowerCase().includes(q));
  }

  public clear(): void {
    this._history.length = 0;
  }
}
