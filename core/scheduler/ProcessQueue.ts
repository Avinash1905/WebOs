/**
 * @file ProcessQueue.ts
 * @description Multi-level priority queue with round-robin fair ordering per bucket.
 */

import type { ProcessPriority } from '../process/index.js';
import { ALL_PRIORITIES, PriorityHelper } from './ProcessPriority.js';
import type { ProcessSchedulingInfo } from './types.js';

export class ProcessQueue {
  private readonly _buckets = new Map<ProcessPriority, ProcessSchedulingInfo[]>();
  private readonly _index = new Map<number, ProcessSchedulingInfo>();
  private _currentPriorityIndex = 0;

  constructor() {
    for (const priority of ALL_PRIORITIES) {
      this._buckets.set(priority, []);
    }
  }

  public enqueue(info: ProcessSchedulingInfo): void {
    this.remove(info.pid);

    const bucket = this._buckets.get(info.priority);
    if (bucket) {
      info.state = 'READY';
      bucket.push(info);
      this._index.set(info.pid, info);
    }
  }

  public dequeue(): ProcessSchedulingInfo | null {
    const totalPriorities = ALL_PRIORITIES.length;
    for (let offset = 0; offset < totalPriorities; offset++) {
      const idx = (this._currentPriorityIndex + offset) % totalPriorities;
      const priority = ALL_PRIORITIES[idx]!;
      const bucket = this._buckets.get(priority);
      if (bucket && bucket.length > 0) {
        const item = bucket.shift()!;
        this._index.delete(item.pid);
        this._currentPriorityIndex = (idx + 1) % totalPriorities;
        return item;
      }
    }
    return null;
  }

  public requeue(info: ProcessSchedulingInfo): void {
    this.enqueue(info);
  }

  public remove(pid: number): ProcessSchedulingInfo | null {
    const item = this._index.get(pid);
    if (!item) return null;

    this._index.delete(pid);
    for (const bucket of this._buckets.values()) {
      const idx = bucket.findIndex((p) => p.pid === pid);
      if (idx !== -1) {
        bucket.splice(idx, 1);
        break;
      }
    }
    return item;
  }

  public get(pid: number): ProcessSchedulingInfo | null {
    return this._index.get(pid) ?? null;
  }

  public has(pid: number): boolean {
    return this._index.has(pid);
  }

  public getAll(): ProcessSchedulingInfo[] {
    const result: ProcessSchedulingInfo[] = [];
    for (const priority of ALL_PRIORITIES) {
      const bucket = this._buckets.get(priority);
      if (bucket) {
        result.push(...bucket);
      }
    }
    return result;
  }

  public size(): number {
    return this._index.size;
  }

  public clear(): void {
    for (const bucket of this._buckets.values()) {
      bucket.length = 0;
    }
    this._index.clear();
    this._currentPriorityIndex = 0;
  }

  public applyAging(agingThresholdMs: number): number {
    const now = Date.now();
    let promotedCount = 0;

    // Process in descending priority order so promoted items are not promoted repeatedly in a single cycle
    const lowerPriorities: ProcessPriority[] = ['HIGH', 'NORMAL', 'LOW', 'IDLE'];
    for (const priority of lowerPriorities) {
      const bucket = this._buckets.get(priority);
      if (!bucket) continue;

      const toPromote: ProcessSchedulingInfo[] = [];
      const remaining: ProcessSchedulingInfo[] = [];

      for (const item of bucket) {
        const waitTime = now - (item.lastRunAt ?? item.enqueuedAt);
        if (waitTime >= agingThresholdMs) {
          const higherPriority = PriorityHelper.getHigherPriority(item.priority);
          if (higherPriority !== item.priority) {
            toPromote.push(item);
            continue;
          }
        }
        remaining.push(item);
      }

      this._buckets.set(priority, remaining);

      for (const item of toPromote) {
        item.priority = PriorityHelper.getHigherPriority(item.priority);
        this.enqueue(item);
        promotedCount++;
      }
    }

    return promotedCount;
  }
}
