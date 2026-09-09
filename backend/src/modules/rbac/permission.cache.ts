/**
 * WebOS Backend - High-Performance In-Memory Permission Cache
 * LRU caching with TTL expiration for user permission sets.
 */

interface CacheEntry {
  readonly permissions: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
  readonly expiresAt: number;
}

export interface PermissionCacheOptions {
  readonly ttlMs?: number; // default 5 minutes
  readonly maxEntries?: number; // default 10,000 entries
}

export class PermissionCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: PermissionCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
    this.maxEntries = options.maxEntries ?? 10000;
  }

  public get(userId: string): { permissions: ReadonlySet<string>; roles: ReadonlySet<string> } | null {
    const entry = this.store.get(userId);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(userId);
      return null;
    }

    // Refresh LRU order: delete and re-insert
    this.store.delete(userId);
    this.store.set(userId, entry);

    return {
      permissions: entry.permissions,
      roles: entry.roles
    };
  }

  public set(
    userId: string,
    permissions: readonly string[],
    roles: readonly string[]
  ): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest item (first key in map iterator)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(userId, {
      permissions: new Set(permissions),
      roles: new Set(roles),
      expiresAt: Date.now() + this.ttlMs
    });
  }

  public invalidate(userId: string): void {
    this.store.delete(userId);
  }

  public invalidateAll(): void {
    this.store.clear();
  }

  public get size(): number {
    return this.store.size;
  }
}

export const defaultPermissionCache = new PermissionCache();
