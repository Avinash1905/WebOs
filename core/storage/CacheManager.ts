/**
 * @file CacheManager.ts
 * @description In-memory bounded LRU cache layer for the WebOS Storage Engine.
 */

/**
 * Manages an in-memory Least-Recently-Used (LRU) cache above persistent storage.
 */
export class CacheManager {
  private _cache = new Map<string, unknown>();
  private _maxEntries: number;
  private _enabled: boolean;

  private _hits = 0;
  private _misses = 0;

  constructor(maxEntries: number = 500, enabled: boolean = true) {
    this._maxEntries = Math.max(1, Math.floor(maxEntries));
    this._enabled = enabled;
  }

  public get isEnabled(): boolean {
    return this._enabled;
  }

  public set isEnabled(val: boolean) {
    this._enabled = val;
    if (!val) {
      this.clear();
    }
  }

  public get maxEntries(): number {
    return this._maxEntries;
  }

  public set maxEntries(limit: number) {
    this._maxEntries = Math.max(1, Math.floor(limit));
    while (this._cache.size > this._maxEntries) {
      const oldestKey = this._cache.keys().next().value;
      if (oldestKey !== undefined) {
        this._cache.delete(oldestKey);
      }
    }
  }

  public get size(): number {
    return this._cache.size;
  }

  public get hits(): number {
    return this._hits;
  }

  public get misses(): number {
    return this._misses;
  }

  /**
   * Retrieves an item from the cache and marks it as most recently used.
   */
  public get<T>(key: string): T | undefined {
    if (!this._enabled) {
      return undefined;
    }

    if (!this._cache.has(key)) {
      this._misses++;
      return undefined;
    }

    this._hits++;
    const value = this._cache.get(key);
    // Refresh LRU position by re-inserting at the end
    this._cache.delete(key);
    this._cache.set(key, value);

    return value as T;
  }

  /**
   * Caches an item, evicting the least recently used item if at capacity.
   */
  public set<T>(key: string, value: T): void {
    if (!this._enabled || this._maxEntries <= 0) {
      return;
    }

    if (this._cache.has(key)) {
      this._cache.delete(key);
    } else if (this._cache.size >= this._maxEntries) {
      // Evict oldest (first inserted in Map iteration)
      const oldestKey = this._cache.keys().next().value;
      if (oldestKey !== undefined) {
        this._cache.delete(oldestKey);
      }
    }

    this._cache.set(key, value);
  }

  /**
   * Removes an item from the cache.
   */
  public delete(key: string): boolean {
    return this._cache.delete(key);
  }

  /**
   * Checks if an item is cached without updating its LRU position.
   */
  public has(key: string): boolean {
    return this._enabled && this._cache.has(key);
  }

  /**
   * Invalidates a single key from cache.
   */
  public invalidate(key: string): void {
    this.delete(key);
  }

  /**
   * Invalidates all keys belonging to a specific namespace.
   *
   * @param namespace - The namespace prefix (e.g., 'filesystem', 'settings').
   */
  public invalidateNamespace(namespace: string): void {
    const prefix = `${namespace}:`;
    for (const key of Array.from(this._cache.keys())) {
      if (key.startsWith(prefix)) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache and resets hit/miss metrics.
   */
  public clear(): void {
    this._cache.clear();
  }

  /**
   * Resets hit/miss statistics.
   */
  public resetStats(): void {
    this._hits = 0;
    this._misses = 0;
  }
}
