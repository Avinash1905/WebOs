/**
 * @file EventRateLimiter.ts
 * @description Token bucket rate limiter preventing event flooding and recursive loops.
 */

export class EventRateLimiter {
  private readonly _buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly _maxTokens: number;
  private readonly _refillRatePerSec: number;

  constructor(maxTokens = 100, refillRatePerSec = 50) {
    this._maxTokens = maxTokens;
    this._refillRatePerSec = refillRatePerSec;
  }

  public tryConsume(key: string, tokens = 1): boolean {
    const now = Date.now();
    let bucket = this._buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this._maxTokens, lastRefill: now };
      this._buckets.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(this._maxTokens, bucket.tokens + elapsedSec * this._refillRatePerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  public reset(key?: string): void {
    if (key) {
      this._buckets.delete(key);
    } else {
      this._buckets.clear();
    }
  }
}
