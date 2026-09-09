/**
 * @file DeadLetterQueue.ts
 * @description Bounded buffer for dropped, failed, or expired events with inspection & replay.
 */

import type { SystemEvent } from './types.js';

export interface DeadLetterEntry {
  readonly event: SystemEvent<unknown>;
  readonly reason: 'LISTENER_ERROR' | 'CIRCUIT_TRIPPED' | 'RATE_LIMITED' | 'UNHANDLED' | 'EXPIRED';
  readonly error?: string;
  readonly timestamp: number;
  readonly retryCount: number;
}

export class DeadLetterQueue {
  private readonly _entries: DeadLetterEntry[] = [];
  private readonly _maxSize: number;

  constructor(maxSize = 200) {
    this._maxSize = maxSize;
  }

  public enqueue(
    event: SystemEvent<unknown>,
    reason: DeadLetterEntry['reason'],
    error?: Error | string,
    retryCount = 0
  ): void {
    const entry: DeadLetterEntry = {
      event,
      reason,
      error: typeof error === 'string' ? error : error?.message,
      timestamp: Date.now(),
      retryCount,
    };

    this._entries.unshift(entry);
    if (this._entries.length > this._maxSize) {
      this._entries.length = this._maxSize;
    }
  }

  public getEntries(filter?: { reason?: DeadLetterEntry['reason']; eventType?: string }): readonly DeadLetterEntry[] {
    let result = this._entries;
    if (filter?.reason) {
      result = result.filter((e) => e.reason === filter.reason);
    }
    if (filter?.eventType) {
      result = result.filter((e) => e.event.type === filter.eventType);
    }
    return Object.freeze([...result]);
  }

  public clear(): void {
    this._entries.length = 0;
  }

  public size(): number {
    return this._entries.length;
  }
}
