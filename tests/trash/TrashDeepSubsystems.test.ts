import { describe, expect, it } from 'vitest';
import {
  TrashDeduplication,
  TrashIndexer,
  TrashAuditTrail,
  TrashRetentionOptimizer,
} from '../../core/trash/index.js';

describe('Trash Deep Subsystems', () => {
  it('TrashDeduplication properly hashes, registers, dedupes identical content and frees on purge', () => {
    const dedup = new TrashDeduplication();
    const content = 'Hello world duplicate content data stream';

    const hash1 = dedup.registerItem('item_1', content);
    const hash2 = dedup.registerItem('item_2', content);

    expect(hash1).toBe(hash2);
    const summary1 = dedup.getSummary();
    expect(summary1.uniqueChunks).toBe(1);
    expect(summary1.deduplicationRatio).toBeGreaterThan(1);

    const reclaimed1 = dedup.releaseItem('item_1');
    expect(reclaimed1).toBe(0); // still referenced by item_2

    const reclaimed2 = dedup.releaseItem('item_2');
    expect(reclaimed2).toBeGreaterThan(0); // now fully released
    expect(dedup.getSummary().uniqueChunks).toBe(0);
  });

  it('TrashIndexer correctly indexes and filters trash items by user, mime, pattern and size', () => {
    const indexer = new TrashIndexer();

    indexer.indexItem({
      id: 'doc1',
      name: 'notes.txt',
      originalPath: '/home/user/docs/notes.txt',
      size: 1024,
      deletedAt: 1000,
      userId: 'user_1',
      mimeType: 'text/plain',
      tags: ['work', 'important'],
    });

    indexer.indexItem({
      id: 'pic1',
      name: 'avatar.png',
      originalPath: '/home/user/pics/avatar.png',
      size: 20480,
      deletedAt: 2000,
      userId: 'user_2',
      mimeType: 'image/png',
      tags: ['personal'],
    });

    const resultsByUser = indexer.query({ userId: 'user_1' });
    expect(resultsByUser.length).toBe(1);
    expect(resultsByUser[0]!.id).toBe('doc1');

    const resultsByMime = indexer.query({ mimeType: 'image/png' });
    expect(resultsByMime.length).toBe(1);
    expect(resultsByMime[0]!.id).toBe('pic1');

    const resultsByTag = indexer.query({ tag: 'important' });
    expect(resultsByTag.length).toBe(1);
    expect(resultsByTag[0]!.id).toBe('doc1');

    const resultsBySize = indexer.query({ minSize: 5000 });
    expect(resultsBySize.length).toBe(1);
    expect(resultsBySize[0]!.id).toBe('pic1');

    indexer.unindexItem('doc1');
    expect(indexer.count).toBe(1);
  });

  it('TrashAuditTrail records cryptographically chained events and verifies chain validity', () => {
    const trail = new TrashAuditTrail();

    trail.record('TRASH', 'item_1', '/path/to/file1.txt', 'user1');
    trail.record('RENAME', 'item_1', '/path/to/file1_renamed.txt', 'user1');
    trail.record('RESTORE', 'item_1', '/path/to/file1.txt', 'user1');

    const integrity = trail.verifyIntegrity();
    expect(integrity.valid).toBe(true);
    expect(trail.getEvents().length).toBe(3);
    expect(trail.getEventsForItem('item_1').length).toBe(3);
  });

  it('TrashRetentionOptimizer calculates evictions based on TTL and watermark limits', () => {
    const optimizer = new TrashRetentionOptimizer({
      maxAgeMs: 10000,
      maxCapacityBytes: 1000,
      highWatermarkRatio: 0.8,
      lowWatermarkRatio: 0.5,
    });

    const now = 20000;
    const items = [
      { id: 'expired1', size: 100, deletedAt: 5000, userId: 'u1' }, // age 15000 > 10000 -> evict
      { id: 'old_large', size: 500, deletedAt: 12000, userId: 'u1' }, // age 8000
      { id: 'fresh', size: 400, deletedAt: 18000, userId: 'u1' }, // age 2000
    ];

    const evictions = optimizer.calculateEvictions(items, now);
    expect(evictions).toContain('expired1');
  });
});
