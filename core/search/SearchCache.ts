/**
 * @file SearchCache.ts
 * @description In-memory LRU cache for search results.
 */

import type { SearchResult } from './types.js';

interface CacheEntry {
  readonly result: SearchResult;
  readonly expiresAt: number;
}

export class SearchCache {
  private readonly _cache = new Map<string, CacheEntry>();
  private readonly _maxSize: number;
  private readonly _ttlMs: number;

  constructor(maxSize = 50, ttlMs = 30000) {
    this._maxSize = maxSize;
    this._ttlMs = ttlMs;
  }

  public get(key: string): SearchResult | null {
    const entry = this._cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }

    this._cache.delete(key);
    this._cache.set(key, entry);
    return entry.result;
  }

  public set(key: string, result: SearchResult): void {
    if (this._cache.has(key)) {
      this._cache.delete(key);
    } else if (this._cache.size >= this._maxSize) {
      const firstKey = this._cache.keys().next().value;
      if (firstKey) this._cache.delete(firstKey);
    }

    this._cache.set(key, {
      result,
      expiresAt: Date.now() + this._ttlMs,
    });
  }

  public clear(): void {
    this._cache.clear();
  }

  public size(): number {
    return this._cache.size;
  }
}
