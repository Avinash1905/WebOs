/**
 * @file StorageEngine.ts
 * @description Central Storage Engine runtime and namespace abstraction for WebOS.
 */

import type { EventBus } from '../events/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import { CacheManager } from './CacheManager.js';
import { Deserializer } from './Deserializer.js';
import { IndexedDBAdapter } from './IndexedDBAdapter.js';
import { MemoryAdapter } from './MemoryAdapter.js';
import { QuotaManager } from './QuotaManager.js';
import { RecoveryManager } from './RecoveryManager.js';
import { Serializer } from './Serializer.js';
import type { StorageAdapter } from './StorageAdapter.js';
import {
  type ResolvedStorageConfig,
  type StorageConfig,
  resolveStorageConfig,
} from './StorageConfig.js';
import { StorageTransaction } from './StorageTransaction.js';
import type { QuotaInfo, StorageHealthReport, StorageStats } from './types.js';

/**
 * Scoped storage interface providing isolated key-value access within a logical namespace.
 */
export class NamespaceStorage {
  private readonly _engine: StorageEngine;
  public readonly namespace: string;

  constructor(engine: StorageEngine, namespace: string) {
    this._engine = engine;
    this.namespace = namespace;
  }

  /**
   * Prefixes a local key with the namespace name.
   */
  private toKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    return this._engine.get<T>(this.toKey(key));
  }

  public async set<T = unknown>(key: string, value: T): Promise<void> {
    return this._engine.set<T>(this.toKey(key), value);
  }

  public async delete(key: string): Promise<void> {
    return this._engine.delete(this.toKey(key));
  }

  public async has(key: string): Promise<boolean> {
    return this._engine.has(this.toKey(key));
  }

  /**
   * Returns all keys in this namespace with the namespace prefix stripped.
   */
  public async keys(): Promise<string[]> {
    const rawKeys = await this._engine.keys(`${this.namespace}:`);
    const prefixLen = this.namespace.length + 1;
    return rawKeys.map((k) => k.slice(prefixLen));
  }

  /**
   * Clears all keys belonging only to this namespace.
   */
  public async clear(): Promise<void> {
    const fullKeys = await this._engine.keys(`${this.namespace}:`);
    await this._engine.deleteMany(fullKeys);
  }

  public async getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>> {
    const fullKeys = keys.map((k) => this.toKey(k));
    const rawMap = await this._engine.getMany<T>(fullKeys);
    const result = new Map<string, T>();
    const prefixLen = this.namespace.length + 1;

    for (const [k, v] of rawMap.entries()) {
      result.set(k.slice(prefixLen), v);
    }
    return result;
  }

  public async setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void> {
    const fullEntries = entries.map(([k, v]) => [this.toKey(k), v] as const);
    return this._engine.setMany<T>(fullEntries);
  }

  public async deleteMany(keys: readonly string[]): Promise<void> {
    const fullKeys = keys.map((k) => this.toKey(k));
    return this._engine.deleteMany(fullKeys);
  }
}

/**
 * The WebOS Storage Engine provides high-performance, modular persistence across WebOS.
 */
export class StorageEngine extends BaseSystemService {
  public override readonly name = 'storage';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = ['event-bus'];

  private readonly _config: ResolvedStorageConfig;
  private readonly _adapter: StorageAdapter;
  private readonly _cache: CacheManager;
  private readonly _quotaManager: QuotaManager;
  private readonly _recoveryManager: RecoveryManager;
  private _eventBus?: EventBus;

  // Diagnostics Counters
  private _reads = 0;
  private _writes = 0;
  private _deletes = 0;

  constructor(config?: StorageConfig) {
    super();
    this._config = resolveStorageConfig(config);
    this._eventBus = config?.eventBus;

    // Resolve adapter instance
    if (this._config.adapter) {
      if (typeof this._config.adapter === 'string') {
        if (this._config.adapter === 'indexeddb') {
          this._adapter = new IndexedDBAdapter(
            this._config.databaseName,
            this._config.version,
            this._config.storeName
          );
        } else {
          this._adapter = new MemoryAdapter();
        }
      } else {
        this._adapter = this._config.adapter;
      }
    } else {
      // Default: IndexedDB in browser, fallback to Memory
      if (
        typeof indexedDB !== 'undefined' ||
        (typeof globalThis !== 'undefined' && 'indexedDB' in globalThis)
      ) {
        this._adapter = new IndexedDBAdapter(
          this._config.databaseName,
          this._config.version,
          this._config.storeName
        );
      } else {
        this._adapter = new MemoryAdapter();
      }
    }

    this._cache = new CacheManager(this._config.maxCacheEntries, this._config.cacheEnabled);
    this._quotaManager = new QuotaManager(
      this._config.quotaWarningThreshold,
      this._config.quotaCriticalThreshold
    );
    this._recoveryManager = new RecoveryManager();
  }

  /**
   * Returns the underlying StorageAdapter instance.
   */
  public get adapter(): StorageAdapter {
    return this._adapter;
  }

  /**
   * Connects an EventBus instance to this storage engine.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  // =========================================================================
  // Core Storage Operations
  // =========================================================================

  /**
   * Retrieves a deserialized value by key.
   */
  public async get<T = unknown>(key: string): Promise<T | undefined> {
    this._reads++;

    // 1. Check in-memory cache
    const cached = this._cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // 2. Fetch from underlying adapter
    const raw = await this._adapter.get<unknown>(key);
    if (raw === undefined) {
      return undefined;
    }

    // 3. Deserialize if string representation
    let value: T;
    if (typeof raw === 'string') {
      try {
        value = Deserializer.deserialize<T>(raw);
      } catch {
        value = raw as T;
      }
    } else {
      value = raw as T;
    }

    // 4. Update cache
    this._cache.set(key, value);
    return value;
  }

  /**
   * Persists a value under the given key.
   */
  public async set<T = unknown>(key: string, value: T): Promise<void> {
    this._writes++;

    // 1. Serialize value
    const serialized = Serializer.serialize(value);

    // 2. Persist to storage adapter
    await this._adapter.set(key, serialized);

    // 3. Update cache
    this._cache.set(key, value);

    // 4. Emit event if EventBus is configured
    this._eventBus?.emit(
      'STORAGE_CHANGED',
      { key, action: 'set' },
      { source: 'storage' }
    );

    // 5. Check storage quota
    await this._quotaManager.checkQuota(this._eventBus);
  }

  /**
   * Deletes a key from storage and invalidates it in the cache.
   */
  public async delete(key: string): Promise<void> {
    this._deletes++;

    await this._adapter.delete(key);
    this._cache.delete(key);

    this._eventBus?.emit(
      'STORAGE_CHANGED',
      { key, action: 'remove' },
      { source: 'storage' }
    );
  }

  /**
   * Checks whether a key exists in storage or cache.
   */
  public async has(key: string): Promise<boolean> {
    if (this._cache.has(key)) {
      return true;
    }
    return this._adapter.has(key);
  }

  /**
   * Lists stored keys, optionally matching a prefix.
   */
  public async keys(prefix?: string): Promise<string[]> {
    return this._adapter.keys(prefix);
  }

  /**
   * Clears all stored keys and flushes the cache.
   */
  public async clear(): Promise<void> {
    await this._adapter.clear();
    this._cache.clear();

    this._eventBus?.emit(
      'STORAGE_CHANGED',
      { action: 'clear' },
      { source: 'storage' }
    );
  }

  /**
   * Batch retrieval of multiple keys.
   */
  public async getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const missingKeys: string[] = [];

    // Check cache first
    for (const key of keys) {
      const cached = this._cache.get<T>(key);
      if (cached !== undefined) {
        result.set(key, cached);
      } else {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      this._reads += missingKeys.length;
      const rawMap = await this._adapter.getMany<unknown>(missingKeys);

      for (const [key, raw] of rawMap.entries()) {
        let val: T;
        if (typeof raw === 'string') {
          try {
            val = Deserializer.deserialize<T>(raw);
          } catch {
            val = raw as T;
          }
        } else {
          val = raw as T;
        }
        this._cache.set(key, val);
        result.set(key, val);
      }
    }

    return result;
  }

  /**
   * Batch write of multiple key-value pairs.
   */
  public async setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void> {
    this._writes += entries.length;

    const serializedEntries: [string, string][] = entries.map(([k, v]) => [
      k,
      Serializer.serialize(v),
    ]);

    await this._adapter.setMany(serializedEntries);

    for (const [k, v] of entries) {
      this._cache.set(k, v);
    }

    this._eventBus?.emit(
      'STORAGE_CHANGED',
      { action: 'set' },
      { source: 'storage' }
    );
  }

  /**
   * Batch deletion of multiple keys.
   */
  public async deleteMany(keys: readonly string[]): Promise<void> {
    this._deletes += keys.length;

    await this._adapter.deleteMany(keys);

    for (const key of keys) {
      this._cache.delete(key);
    }

    this._eventBus?.emit(
      'STORAGE_CHANGED',
      { action: 'remove' },
      { source: 'storage' }
    );
  }

  // =========================================================================
  // Namespaces & Transactions
  // =========================================================================

  /**
   * Returns a scoped storage interface for a logical namespace.
   *
   * @param namespaceName - Name of the namespace (e.g. 'filesystem', 'settings', 'users').
   */
  public namespace(namespaceName: string): NamespaceStorage {
    return new NamespaceStorage(this, namespaceName);
  }

  /**
   * Executes an atomic storage transaction.
   *
   * @param fn - Callback receiving the StorageTransaction context.
   */
  public async transaction<R>(fn: (tx: StorageTransaction) => Promise<R>): Promise<R> {
    const tx = new StorageTransaction(this._adapter, this._cache);
    try {
      const result = await fn(tx);
      await tx.commit();
      return result;
    } catch (err) {
      tx.rollback();
      throw err;
    }
  }

  // =========================================================================
  // Health, Diagnostics & Quota
  // =========================================================================

  /**
   * Returns diagnostic statistics for the Storage Engine.
   */
  public async getStats(): Promise<StorageStats> {
    const allKeys = await this._adapter.keys();
    const quota = await this._quotaManager.getQuotaInfo();

    return {
      reads: this._reads,
      writes: this._writes,
      deletes: this._deletes,
      cacheHits: this._cache.hits,
      cacheMisses: this._cache.misses,
      cacheEntries: this._cache.size,
      totalKeys: allKeys.length,
      quotaBytes: quota.quotaBytes,
      usedBytes: quota.usedBytes,
      availableBytes: quota.availableBytes,
    };
  }

  /**
   * Validates storage health and tests basic read/write operations.
   */
  public async healthCheck(): Promise<StorageHealthReport> {
    return this._recoveryManager.healthCheck(this._adapter);
  }

  /**
   * Attempts automatic recovery if storage is in an error state.
   */
  public async recover(): Promise<boolean> {
    return this._recoveryManager.attemptRecovery(this._adapter, this._cache);
  }

  /**
   * Returns current browser storage quota metrics.
   */
  public async getQuota(): Promise<QuotaInfo> {
    return this._quotaManager.getQuotaInfo();
  }

  /**
   * Flushes the in-memory cache to guarantee next reads pull directly from persistent storage.
   */
  public async flush(): Promise<void> {
    this._cache.clear();
  }

  // =========================================================================
  // Kernel Lifecycle Hooks
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    await this._adapter.initialize();
    this._eventBus?.emit(
      'STORAGE_READY',
      { driver: this._adapter.name },
      { source: 'storage' }
    );
  }

  protected override async onStart(): Promise<void> {
    await this._quotaManager.checkQuota(this._eventBus);
  }

  protected override async onStop(): Promise<void> {
    this._cache.clear();
    await this._adapter.close();
  }

  protected override async onReset(): Promise<void> {
    this._cache.clear();
    this._reads = 0;
    this._writes = 0;
    this._deletes = 0;
    this._cache.resetStats();
  }
}
