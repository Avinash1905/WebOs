import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import { Kernel } from '../../core/kernel/index.js';
import {
  CacheManager,
  Deserializer,
  QuotaManager,
  Serializer,
  StorageEngine,
  StorageSerializationError,
} from '../../core/storage/index.js';

describe('Storage Engine (Module 3)', () => {
  // =========================================================================
  // 1. Basic CRUD Operations
  // =========================================================================
  describe('Basic Storage Operations', () => {
    it('sets, gets, checks existence, and deletes key-value pairs', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      expect(await storage.has('user:1')).toBe(false);
      expect(await storage.get('user:1')).toBeUndefined();

      await storage.set('user:1', { name: 'Alice', age: 30 });
      expect(await storage.has('user:1')).toBe(true);

      const user = await storage.get<{ name: string; age: number }>('user:1');
      expect(user).toEqual({ name: 'Alice', age: 30 });

      await storage.delete('user:1');
      expect(await storage.has('user:1')).toBe(false);
      expect(await storage.get('user:1')).toBeUndefined();
    });

    it('lists all keys and filters by prefix', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.set('file:1.txt', 'hello');
      await storage.set('file:2.txt', 'world');
      await storage.set('pref:theme', 'dark');

      const allKeys = await storage.keys();
      expect(allKeys.sort()).toEqual(['file:1.txt', 'file:2.txt', 'pref:theme'].sort());

      const fileKeys = await storage.keys('file:');
      expect(fileKeys.sort()).toEqual(['file:1.txt', 'file:2.txt'].sort());
    });

    it('clears all storage entries', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.set('k1', 'v1');
      await storage.set('k2', 'v2');
      expect(await storage.keys()).toHaveLength(2);

      await storage.clear();
      expect(await storage.keys()).toHaveLength(0);
      expect(await storage.get('k1')).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. Serialization & Deserialization
  // =========================================================================
  describe('Serialization & Deserialization', () => {
    it('serializes and deserializes primitives, complex objects, and arrays', () => {
      const input = {
        str: 'WebOS',
        num: 42.5,
        bool: true,
        nil: null,
        arr: [1, 'two', { three: 3 }],
      };

      const serialized = Serializer.serialize(input);
      const output = Deserializer.deserialize<typeof input>(serialized);

      expect(output).toEqual(input);
    });

    it('serializes and reconstructs Date, RegExp, Uint8Array, ArrayBuffer, Map, and Set', () => {
      const now = new Date('2026-09-09T12:00:00.000Z');
      const regex = /webos-test/gi;
      const u8 = new Uint8Array([10, 20, 30, 40]);
      const map = new Map<string, number>([['a', 1], ['b', 2]]);
      const set = new Set<string>(['alpha', 'beta']);

      const payload = { now, regex, u8, map, set };

      const serialized = Serializer.serialize(payload);
      const deserialized = Deserializer.deserialize<typeof payload>(serialized);

      expect(deserialized.now).toBeInstanceOf(Date);
      expect(deserialized.now.toISOString()).toBe(now.toISOString());

      expect(deserialized.regex).toBeInstanceOf(RegExp);
      expect(deserialized.regex.source).toBe('webos-test');
      expect(deserialized.regex.flags).toBe('gi');

      expect(deserialized.u8).toBeInstanceOf(Uint8Array);
      expect(Array.from(deserialized.u8)).toEqual([10, 20, 30, 40]);

      expect(deserialized.map).toBeInstanceOf(Map);
      expect(Array.from(deserialized.map.entries())).toEqual([['a', 1], ['b', 2]]);

      expect(deserialized.set).toBeInstanceOf(Set);
      expect(Array.from(deserialized.set.values())).toEqual(['alpha', 'beta']);
    });

    it('throws StorageSerializationError when serializing functions or symbols', () => {
      expect(() => Serializer.serialize({ fn: () => {} })).toThrowError(
        StorageSerializationError
      );
      expect(() => Serializer.serialize({ sym: Symbol('test') })).toThrowError(
        StorageSerializationError
      );
    });

    it('detects circular references during serialization', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      expect(() => Serializer.serialize(circularObj)).toThrowError(
        StorageSerializationError
      );
    });
  });

  // =========================================================================
  // 3. Cache Manager & LRU Eviction
  // =========================================================================
  describe('Cache Manager', () => {
    it('manages LRU cache hits, misses, and updates', () => {
      const cache = new CacheManager(2);

      expect(cache.get('a')).toBeUndefined();
      expect(cache.misses).toBe(1);

      cache.set('a', 100);
      expect(cache.get('a')).toBe(100);
      expect(cache.hits).toBe(1);
      expect(cache.size).toBe(1);

      cache.set('b', 200);
      expect(cache.size).toBe(2);

      // Access 'a' to make it most recently used, so 'b' is least recently used
      expect(cache.get('a')).toBe(100);

      // Insert 'c' -> capacity 2 reached -> should evict 'b'
      cache.set('c', 300);

      expect(cache.has('a')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('b')).toBe(false); // 'b' evicted
    });

    it('invalidates cache by key and by namespace', () => {
      const cache = new CacheManager(10);
      cache.set('fs:file1', 'data1');
      cache.set('fs:file2', 'data2');
      cache.set('settings:theme', 'dark');

      expect(cache.size).toBe(3);

      cache.invalidateNamespace('fs');

      expect(cache.has('fs:file1')).toBe(false);
      expect(cache.has('fs:file2')).toBe(false);
      expect(cache.has('settings:theme')).toBe(true);
      expect(cache.size).toBe(1);
    });
  });

  // =========================================================================
  // 4. Batch Operations
  // =========================================================================
  describe('Batch Operations', () => {
    it('performs getMany, setMany, and deleteMany efficiently', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.setMany([
        ['k1', { val: 1 }],
        ['k2', { val: 2 }],
        ['k3', { val: 3 }],
      ]);

      const map = await storage.getMany<{ val: number }>(['k1', 'k3', 'k4']);
      expect(map.size).toBe(2);
      expect(map.get('k1')).toEqual({ val: 1 });
      expect(map.get('k3')).toEqual({ val: 3 });
      expect(map.get('k4')).toBeUndefined();

      await storage.deleteMany(['k1', 'k2']);
      expect(await storage.has('k1')).toBe(false);
      expect(await storage.has('k2')).toBe(false);
      expect(await storage.has('k3')).toBe(true);
    });
  });

  // =========================================================================
  // 5. Logical Namespaces
  // =========================================================================
  describe('Namespaces', () => {
    it('isolates keys and strips prefix when querying namespace', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      const fsStorage = storage.namespace('filesystem');
      const settingsStorage = storage.namespace('settings');

      await fsStorage.set('notes.txt', { content: 'hello' });
      await settingsStorage.set('theme', 'solarized');

      // Under the hood, keys are prefixed
      const rawKeys = await storage.keys();
      expect(rawKeys.sort()).toEqual(['filesystem:notes.txt', 'settings:theme'].sort());

      // Namespace keys method returns stripped keys
      const fsKeys = await fsStorage.keys();
      expect(fsKeys).toEqual(['notes.txt']);

      const settingKeys = await settingsStorage.keys();
      expect(settingKeys).toEqual(['theme']);

      // Namespace get
      const note = await fsStorage.get<{ content: string }>('notes.txt');
      expect(note).toEqual({ content: 'hello' });

      // Namespace clear only deletes its own keys
      await fsStorage.clear();
      expect(await fsStorage.keys()).toEqual([]);
      expect(await settingsStorage.get('theme')).toBe('solarized');
    });
  });

  // =========================================================================
  // 6. Transactions
  // =========================================================================
  describe('Transactions', () => {
    it('commits all staged writes and deletes atomically', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.set('init_key', 'initial');

      await storage.transaction(async (tx) => {
        tx.set('tx_key1', 'v1');
        tx.set('tx_key2', 'v2');
        tx.delete('init_key');

        // Reads within transaction reflect staged mutations
        expect(await tx.get('tx_key1')).toBe('v1');
        expect(await tx.get('init_key')).toBeUndefined();
      });

      expect(await storage.get('tx_key1')).toBe('v1');
      expect(await storage.get('tx_key2')).toBe('v2');
      expect(await storage.get('init_key')).toBeUndefined();
    });

    it('rolls back staged operations when transaction throws an error', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.set('original', 'keep_me');

      await expect(
        storage.transaction(async (tx) => {
          tx.set('fail_key', 'should_not_exist');
          tx.delete('original');
          throw new Error('Transaction aborted intentionally');
        })
      ).rejects.toThrowError('Transaction aborted intentionally');

      expect(await storage.get('fail_key')).toBeUndefined();
      expect(await storage.get('original')).toBe('keep_me');
    });
  });

  // =========================================================================
  // 7. Quota Monitoring & Recovery
  // =========================================================================
  describe('Quota & Recovery', () => {
    it('retrieves quota information safely', async () => {
      const quotaManager = new QuotaManager();
      const info = await quotaManager.getQuotaInfo();

      expect(info).toBeDefined();
      expect(typeof info.supported).toBe('boolean');
    });

    it('performs active storage health check', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      const health = await storage.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.adapter).toBe('memory');
      expect(health.initialized).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('performs recovery of storage adapter and cache', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();

      await storage.set('k', 'v');
      const recovered = await storage.recover();

      expect(recovered).toBe(true);
      expect(await storage.get('k')).toBe('v');
    });
  });

  // =========================================================================
  // 8. Statistics Tracking
  // =========================================================================
  describe('Storage Statistics', () => {
    it('tracks read, write, delete, and cache statistics', async () => {
      const storage = new StorageEngine({ adapter: 'memory', maxCacheEntries: 10 });
      await storage.initialize();

      await storage.set('s1', 'v1'); // 1 write
      await storage.set('s2', 'v2'); // 1 write

      await storage.get('s1'); // cache hit (written items cached)
      await storage.flush();   // clears cache
      await storage.get('s1'); // cache miss + 1 read

      await storage.delete('s2'); // 1 delete

      const stats = await storage.getStats();

      expect(stats.writes).toBe(2);
      expect(stats.reads).toBe(2);
      expect(stats.deletes).toBe(1);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.totalKeys).toBe(1);
    });
  });

  // =========================================================================
  // 9. Event Bus & Kernel Lifecycle Integration
  // =========================================================================
  describe('Kernel & EventBus Integration', () => {
    it('registers as a SystemService in Kernel and manages OS lifecycle', async () => {
      const kernel = new Kernel();
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });

      kernel.registerService(eventBus);
      kernel.registerService(storage);

      expect(storage.name).toBe('storage');
      expect(storage.getStatus()).toBe('REGISTERED');

      await kernel.initialize();
      expect(storage.getStatus()).toBe('INITIALIZED');

      await kernel.start();
      expect(storage.getStatus()).toBe('RUNNING');

      // Test storage operations while running
      await storage.set('kernel_test', { active: true });
      expect(await storage.get('kernel_test')).toEqual({ active: true });

      await kernel.stop();
      expect(storage.getStatus()).toBe('STOPPED');
    });

    it('emits STORAGE_CHANGED and STORAGE_READY events on EventBus', async () => {
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });

      const capturedActions: string[] = [];
      eventBus.subscribe('STORAGE_CHANGED', (payload) => {
        capturedActions.push(payload.action);
      });

      let readyEmitted = false;
      eventBus.subscribe('STORAGE_READY', () => {
        readyEmitted = true;
      });

      await storage.initialize();
      expect(readyEmitted).toBe(true);

      await storage.set('event_key', 'val');
      await storage.delete('event_key');
      await storage.clear();

      expect(capturedActions).toEqual(['set', 'remove', 'clear']);
    });
  });
});
