import { describe, expect, it } from 'vitest';
import { FileSystem } from '../../core/filesystem/index.js';
import { StorageEngine } from '../../core/storage/index.js';
import { TrashItemNotFoundError, TrashManager } from '../../core/trash/index.js';

describe('Trash & Recovery Engine', () => {
  it('moves a file to trash and preserves its metadata and content', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const fs = new FileSystem({ storage });
    const trashManager = new TrashManager({ storage, fileSystem: fs });
    await fs.initialize();
    await trashManager.initialize();

    // Create file
    await fs.createFile('/home/user/Documents/report.docx', {
      content: 'Important Quarterly Report',
    });

    // Move to trash
    const entry = await trashManager.moveToTrash('/home/user/Documents/report.docx', {
      deletedBy: 'user_123',
    });

    expect(entry.trashId).toBeDefined();
    expect(entry.originalPath).toBe('/home/user/Documents/report.docx');
    expect(entry.originalName).toBe('report.docx');
    expect(entry.deletedBy).toBe('user_123');

    // File should no longer exist in VFS
    expect(await fs.exists('/home/user/Documents/report.docx')).toBe(false);

    // Should appear in trash list
    const trashList = await trashManager.listTrash();
    expect(trashList.length).toBe(1);
    expect(trashList[0]?.trashId).toBe(entry.trashId);
  });

  it('restores a file from trash back to its original path', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const fs = new FileSystem({ storage });
    const trashManager = new TrashManager({ storage, fileSystem: fs });
    await fs.initialize();
    await trashManager.initialize();

    await fs.createFile('/home/user/Desktop/notes.txt', {
      content: 'Meeting notes 2026',
    });

    const entry = await trashManager.moveToTrash('/home/user/Desktop/notes.txt');

    // Restore to original location
    const restored = await trashManager.restore(entry.trashId);
    expect(restored.path).toBe('/home/user/Desktop/notes.txt');

    // File is back in VFS with original content
    expect(await fs.exists('/home/user/Desktop/notes.txt')).toBe(true);
    const content = await fs.readFile('/home/user/Desktop/notes.txt');
    expect(content).toBe('Meeting notes 2026');

    // Trash should now be empty
    expect((await trashManager.listTrash()).length).toBe(0);
  });

  it('restores a file to a custom destination path', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const fs = new FileSystem({ storage });
    const trashManager = new TrashManager({ storage, fileSystem: fs });
    await fs.initialize();
    await trashManager.initialize();

    await fs.createFile('/home/user/Downloads/file.pdf', {
      content: 'PDF content',
    });

    const entry = await trashManager.moveToTrash('/home/user/Downloads/file.pdf');

    const restored = await trashManager.restore(entry.trashId, {
      destinationPath: '/home/user/Documents/restored.pdf',
    });

    expect(restored.path).toBe('/home/user/Documents/restored.pdf');
    expect(await fs.exists('/home/user/Documents/restored.pdf')).toBe(true);
    expect(await fs.exists('/home/user/Downloads/file.pdf')).toBe(false);
  });

  it('purges and empties trash permanently', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const fs = new FileSystem({ storage });
    const trashManager = new TrashManager({ storage, fileSystem: fs });
    await fs.initialize();
    await trashManager.initialize();

    await fs.createFile('/home/user/Documents/doc1.txt', { content: '1' });
    await fs.createFile('/home/user/Documents/doc2.txt', { content: '2' });

    const entry1 = await trashManager.moveToTrash('/home/user/Documents/doc1.txt');
    await trashManager.moveToTrash('/home/user/Documents/doc2.txt');

    expect((await trashManager.listTrash()).length).toBe(2);

    // Purge single item
    await trashManager.purgeTrash(entry1.trashId);
    expect((await trashManager.listTrash()).length).toBe(1);

    // Attempting to restore purged item throws error
    await expect(trashManager.restore(entry1.trashId)).rejects.toThrow(
      TrashItemNotFoundError
    );

    // Empty entire trash
    await trashManager.emptyTrash();
    expect((await trashManager.listTrash()).length).toBe(0);
  });

  it('computes accurate trash metrics', async () => {
    const storage = new StorageEngine({ adapter: 'memory' });
    const fs = new FileSystem({ storage });
    const trashManager = new TrashManager({ storage, fileSystem: fs });
    await fs.initialize();
    await trashManager.initialize();

    await fs.createFile('/home/user/Documents/data.txt', {
      content: '1234567890',
    });

    await trashManager.moveToTrash('/home/user/Documents/data.txt');

    const stats = await trashManager.getTrashStats();
    expect(stats.totalItems).toBe(1);
    expect(stats.totalBytes).toBe(10);
    expect(stats.oldestItemTimestamp).toBeDefined();
  });
});
