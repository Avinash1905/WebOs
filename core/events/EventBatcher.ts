/**
 * @file EventBatcher.ts
 * @description Event micro-batching buffer with debounce timers and maximum size triggers.
 */

import type { SystemEvent } from './types.js';

export class EventBatcher {
  private readonly _queue: SystemEvent<unknown>[] = [];
  private _timer?: ReturnType<typeof setTimeout>;
  private readonly _maxBatchSize: number;
  private readonly _flushIntervalMs: number;
  private readonly _onFlush: (batch: SystemEvent<unknown>[]) => void | Promise<void>;

  constructor(
    onFlush: (batch: SystemEvent<unknown>[]) => void | Promise<void>,
    maxBatchSize = 50,
    flushIntervalMs = 50
  ) {
    this._onFlush = onFlush;
    this._maxBatchSize = maxBatchSize;
    this._flushIntervalMs = flushIntervalMs;
  }

  public add(event: SystemEvent<unknown>): void {
    this._queue.push(event);

    if (this._queue.length >= this._maxBatchSize) {
      this.flush();
    } else if (!this._timer) {
      this._timer = setTimeout(() => {
        this.flush();
      }, this._flushIntervalMs);
    }
  }

  public flush(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }

    if (this._queue.length === 0) return;

    const batch = this._queue.splice(0, this._queue.length);
    void this._onFlush(batch);
  }

  public size(): number {
    return this._queue.length;
  }

  public clear(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
    this._queue.length = 0;
  }
}
