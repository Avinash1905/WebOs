import { describe, it, expect } from 'vitest';
import {
  WALJournal,
  BPlusTreeIndex,
  StorageCompactor,
  EncryptedStorageAdapter,
  StorageSnapshotEngine
} from '../../core/storage/index.js';

describe('Storage Engine Deep Subsystems', () => {
  describe('WALJournal', () => {
    it('should append write-ahead log records and truncate committed entries', () => {
      const wal = new WALJournal();
      const e1 = wal.logSet('user:1', { name: 'Alice' });
      const e2 = wal.logDelete('user:0');

      expect(wal.getEntryCount()).toBe(2);
      expect(wal.getUncheckpointedEntries(e1.seq)).toHaveLength(1);

      wal.truncate(e2.seq);
      expect(wal.getEntryCount()).toBe(0);
    });
  });

  describe('BPlusTreeIndex', () => {
    it('should insert keys and perform range scans', () => {
      const bpt = new BPlusTreeIndex();
      bpt.insert('apple', 1);
      bpt.insert('banana', 2);
      bpt.insert('cherry', 3);
      bpt.insert('date', 4);

      expect(bpt.get('banana')).toBe(2);

      const range = bpt.rangeScan('banana', 'cherry');
      expect(range.map(r => r.key)).toEqual(['banana', 'cherry']);
    });
  });

  describe('StorageCompactor', () => {
    it('should purge tombstones and compute fragmentation ratio', () => {
      const map = new Map<string, string | null>([
        ['k1', 'val1'],
        ['k2', null],
        ['k3', 'val3'],
        ['k4', null]
      ]);

      expect(StorageCompactor.calculateFragmentation(2, 2)).toBe(50);
      const res = StorageCompactor.compactMap(map, v => v === null);
      expect(res.freedCount).toBe(2);
      expect(map.size).toBe(2);
    });
  });

  describe('EncryptedStorageAdapter', () => {
    it('should encrypt and decrypt strings correctly', () => {
      const enc = new EncryptedStorageAdapter('my_super_secret_key_123');
      const plain = 'WebOS Confidential Storage Data';
      const cipher = enc.encrypt(plain);

      expect(cipher.startsWith('enc_')).toBe(true);
      expect(cipher).not.toBe(plain);
      expect(enc.decrypt(cipher)).toBe(plain);
    });
  });

  describe('StorageSnapshotEngine', () => {
    it('should take and restore point-in-time snapshots', () => {
      const engine = new StorageSnapshotEngine();
      const data = new Map<string, unknown>([['k1', 'v1'], ['k2', 'v2']]);

      const snap = engine.createSnapshot('Initial state', data);
      data.set('k1', 'mutated_v1');

      const restored = engine.restoreSnapshot(snap.snapshotId);
      expect(restored?.get('k1')).toBe('v1');
    });
  });
});
