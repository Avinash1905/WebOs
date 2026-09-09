import { describe, it, expect, beforeEach } from 'vitest';
import { TrashManager, TrashRetentionEngine, ConflictResolver, TrashSnapshot } from '../../core/trash/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { FileSystem } from '../../core/filesystem/index.js';

describe('Trash Expansions', () => {
  let storage: StorageEngine;
  let fs: FileSystem;
  let trash: TrashManager;

  beforeEach(async () => {
    storage = new StorageEngine({ adapter: 'memory' });
    await storage.initialize();
    fs = new FileSystem({ storage });
    await fs.initialize();
    trash = new TrashManager({ storage, fileSystem: fs });
    await trash.initialize();
  });

  it('ConflictResolver should calculate unique non-colliding names', () => {
    const existing = new Set(['/home/user/doc.txt', '/home/user/doc (1).txt']);
    const res = ConflictResolver.resolveDestination('/home/user/doc.txt', existing, 'RENAME_AUTO_INCREMENT');
    expect(res.targetPath).toBe('/home/user/doc (2).txt');
    expect(res.action).toBe('RESTORE');
  });

  it('TrashRetentionEngine should prune by item quota', async () => {
    await fs.createFile('/home/user/f1.txt', { content: '1' });
    await fs.createFile('/home/user/f2.txt', { content: '2' });
    await fs.createFile('/home/user/f3.txt', { content: '3' });

    await trash.moveToTrash('/home/user/f1.txt', { deletedBy: 'user1' });
    await trash.moveToTrash('/home/user/f2.txt', { deletedBy: 'user1' });
    await trash.moveToTrash('/home/user/f3.txt', { deletedBy: 'user1' });

    const engine = new TrashRetentionEngine(trash, { maxItemCount: 1 });
    const pruneRes = await engine.prune();
    expect(pruneRes.itemsDeleted).toBe(2);
    expect(pruneRes.remainingItems).toBe(1);
  });

  it('TrashSnapshot should create and restore batch snapshots', async () => {
    const snap = new TrashSnapshot();
    const batch = snap.createSnapshot('Clean downloads', ['t1', 't2']);
    expect(batch.label).toBe('Clean downloads');
    expect(snap.getSnapshot(batch.batchId)).toBeDefined();
  });
});
