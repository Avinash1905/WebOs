/**
 * @file TrashRetentionOptimizer.ts
 * @description Intelligent multi-policy eviction and retention optimization engine for Trash.
 */

export interface EvictionCandidate {
  readonly id: string;
  readonly size: number;
  readonly deletedAt: number;
  readonly userId: string;
  readonly priorityScore: number;
}

export interface TrashOptimizerPolicy {
  readonly maxAgeMs: number;
  readonly maxCapacityBytes: number;
  readonly highWatermarkRatio: number; // e.g. 0.85
  readonly lowWatermarkRatio: number;  // e.g. 0.65
}

export class TrashRetentionOptimizer {
  private readonly _policy: TrashOptimizerPolicy;

  constructor(policy?: Partial<TrashOptimizerPolicy>) {
    this._policy = {
      maxAgeMs: policy?.maxAgeMs ?? 30 * 24 * 60 * 60 * 1000, // 30 days
      maxCapacityBytes: policy?.maxCapacityBytes ?? 100 * 1024 * 1024, // 100MB
      highWatermarkRatio: policy?.highWatermarkRatio ?? 0.85,
      lowWatermarkRatio: policy?.lowWatermarkRatio ?? 0.65,
    };
  }

  /**
   * Determines which items must be evicted according to TTL and capacity limits.
   */
  public calculateEvictions(
    items: readonly { id: string; size: number; deletedAt: number; userId: string }[],
    now: number = Date.now()
  ): string[] {
    const evictions: string[] = [];
    let totalSize = items.reduce((sum, item) => sum + item.size, 0);

    // 1. Evict expired TTL items first
    const unexpired: { id: string; size: number; deletedAt: number; userId: string; age: number }[] = [];
    for (const item of items) {
      const age = now - item.deletedAt;
      if (age > this._policy.maxAgeMs) {
        evictions.push(item.id);
        totalSize -= item.size;
      } else {
        unexpired.push({ ...item, age });
      }
    }

    // 2. If remaining size exceeds high watermark, evict oldest items until reaching low watermark
    const highLimit = this._policy.maxCapacityBytes * this._policy.highWatermarkRatio;
    const lowLimit = this._policy.maxCapacityBytes * this._policy.lowWatermarkRatio;

    if (totalSize > highLimit) {
      // Sort oldest first (descending age)
      unexpired.sort((a, b) => b.age - a.age);

      for (const item of unexpired) {
        if (totalSize <= lowLimit) break;
        evictions.push(item.id);
        totalSize -= item.size;
      }
    }

    return evictions;
  }

  /**
   * Returns current policy parameters.
   */
  public getPolicy(): TrashOptimizerPolicy {
    return { ...this._policy };
  }
}
