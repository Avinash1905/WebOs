/**
 * @file ClipboardHistory.ts
 * @description Bounded in-memory FIFO history buffer for clipboard items.
 */

import type { ClipboardItem } from './types.js';

export class ClipboardHistory {
  private readonly _items: ClipboardItem[] = [];
  private readonly _maxSize: number;

  constructor(maxSize = 20) {
    this._maxSize = Math.max(1, maxSize);
  }

  public add(item: ClipboardItem): void {
    if (this._items.length > 0 && this._items[0]!.id === item.id) {
      return;
    }

    this._items.unshift(item);

    if (this._items.length > this._maxSize) {
      this._items.length = this._maxSize;
    }
  }

  public get(id: string): ClipboardItem | null {
    return this._items.find((item) => item.id === id) ?? null;
  }

  public getAll(): readonly ClipboardItem[] {
    return Object.freeze([...this._items]);
  }

  public remove(id: string): boolean {
    const idx = this._items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this._items.splice(idx, 1);
      return true;
    }
    return false;
  }

  public clear(): void {
    this._items.length = 0;
  }

  public size(): number {
    return this._items.length;
  }
}
