import { describe, it, expect } from 'vitest';
import {
  StorageEngine,
  DataIntegrityManager,
  StorageDriverPool,
  MemoryAdapter,
  SchemaMigrationEngine,
  StorageQueryIterator,
} from '../../core/storage/index.js';

describe('Module 3: Storage Engine Deep Expansions', () => {
  describe('DataIntegrityManager', () => {
    it('computes CRC32 checksums and detects payload corruption', () => {
      const data = JSON.stringify({ user: 'admin', role: 'root' });
      const checksum = DataIntegrityManager.computeChecksum(data);
      expect(checksum).toBeGreaterThan(0);

      expect(DataIntegrityManager.verifyChecksum(data, checksum)).toBe(true);
      expect(DataIntegrityManager.verifyChecksum(data + 'corrupted', checksum)).toBe(false);
    });
  });

  describe('StorageDriverPool', () => {
    it('executes operations with automated driver fallback', async () => {
      const primary = new MemoryAdapter();
      const fallback = new MemoryAdapter();
      await primary.initialize();
      await fallback.initialize();

      const pool = new StorageDriverPool([primary, fallback]);

      const result = await pool.executeWithFallback(async (driver) => {
        await driver.set('test_key', 'hello');
        return await driver.get<string>('test_key');
      });

      expect(result).toBe('hello');
    });
  });

  describe('SchemaMigrationEngine', () => {
    it('runs incremental migrations and updates schema version', async () => {
      const storage = new StorageEngine({ adapter: new MemoryAdapter() });
      await storage.initialize();
      await storage.start();

      const migrationEngine = new SchemaMigrationEngine(storage);

      migrationEngine.registerMigration({
        version: 1,
        name: 'create_default_config',
        up: async (st) => {
          await st.set('config:theme', 'dark');
        },
      });

      migrationEngine.registerMigration({
        version: 2,
        name: 'migrate_user_settings',
        up: async (st) => {
          await st.set('config:locale', 'en-US');
        },
      });

      const res = await migrationEngine.migrateToLatest();
      expect(res.previousVersion).toBe(0);
      expect(res.newVersion).toBe(2);
      expect(res.appliedCount).toBe(2);

      expect(await storage.get('config:theme')).toBe('dark');
      expect(await storage.get('config:locale')).toBe('en-US');
    });
  });

  describe('StorageQueryIterator', () => {
    it('queries and paginates storage items with prefix filtering', async () => {
      const storage = new StorageEngine({ adapter: new MemoryAdapter() });
      await storage.initialize();
      await storage.start();

      await storage.set('user:1', { name: 'Alice', active: true });
      await storage.set('user:2', { name: 'Bob', active: false });
      await storage.set('user:3', { name: 'Charlie', active: true });
      await storage.set('system:logs', { count: 100 });

      const queryRes = await StorageQueryIterator.query<{ name: string; active: boolean }>(storage, {
        prefix: 'user:',
        filter: (_k, v) => v.active === true,
        limit: 1,
        offset: 0,
      });

      expect(queryRes.total).toBe(2);
      expect(queryRes.items.length).toBe(1);
      expect(queryRes.items[0]?.value.name).toBe('Alice');
    });
  });
});
