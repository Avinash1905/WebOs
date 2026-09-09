import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from '../../core/search/SearchEngine.js';
import { FileSystem } from '../../core/filesystem/FileSystem.js';
import { StorageEngine } from '../../core/storage/StorageEngine.js';
import { EventBus } from '../../core/events/EventBus.js';
import { PermissionManager } from '../../core/permissions/PermissionManager.js';
import { UserManager } from '../../core/users/UserManager.js';

describe('SearchEngine', () => {
  let eventBus: EventBus;
  let storage: StorageEngine;
  let userManager: UserManager;
  let permissionManager: PermissionManager;
  let fs: FileSystem;
  let searchEngine: SearchEngine;

  beforeEach(async () => {
    eventBus = new EventBus();
    storage = new StorageEngine({ adapter: 'memory' });
    await storage.initialize();
    await storage.start();

    userManager = new UserManager({ eventBus, storage });
    permissionManager = new PermissionManager({ eventBus, storage, userManager });
    fs = new FileSystem({ eventBus, storage, permissionManager, userManager });
    userManager.attachFileSystem(fs);

    await fs.initialize();
    await fs.start();
    await userManager.initialize();
    await userManager.start();
    await permissionManager.initialize();
    await permissionManager.start();

    const sysCtx = { isSystem: true };
    if (!(await fs.exists('/documents'))) {
      await fs.createDirectory('/documents', undefined, sysCtx);
    }
    await fs.createFile('/documents/report.pdf', { content: 'PDF Data' }, sysCtx);
    await fs.createFile('/documents/notes.txt', { content: 'Hello World Note' }, sysCtx);
    await fs.createFile('/documents/todo.md', { content: 'Todo list' }, sysCtx);
    await fs.createFile('/system/kernel.log', { content: 'Kernel started' }, sysCtx);
    await fs.createFile('/system/config.json', { content: '{"theme":"dark"}' }, sysCtx);

    searchEngine = new SearchEngine({
      fileSystem: fs,
      eventBus,
      permissionManager,
      maxCacheSize: 20,
    });
    await searchEngine.initialize();
    await searchEngine.start();
  });

  it('should build index and search by substring query', async () => {
    const res = await searchEngine.search({ query: 'notes' });

    expect(res.total).toBe(1);
    expect(res.items[0]?.name).toBe('notes.txt');
    expect(res.items[0]?.path).toBe('/documents/notes.txt');
    expect(res.items[0]?.type).toBe('file');
  });

  it('should support extension filtering', async () => {
    const res = await searchEngine.search({
      query: '',
      extensions: ['txt', 'md'],
    });

    expect(res.total).toBe(2);
    const names = res.items.map((i) => i.name);
    expect(names).toContain('notes.txt');
    expect(names).toContain('todo.md');
    expect(names).not.toContain('report.pdf');
  });

  it('should filter by file types (only directories or only files)', async () => {
    const dirs = await searchEngine.search({
      query: '',
      fileTypes: ['directory'],
    });

    expect(dirs.items.every((i) => i.type === 'directory')).toBe(true);
    const dirPaths = dirs.items.map((i) => i.path);
    expect(dirPaths).toContain('/documents');
    expect(dirPaths).toContain('/system');

    const files = await searchEngine.search({
      query: '',
      fileTypes: ['file'],
    });
    expect(files.items.every((i) => i.type === 'file')).toBe(true);
  });

  it('should support rootPath scoping', async () => {
    const res = await searchEngine.search({
      query: '',
      rootPath: '/documents',
    });

    expect(res.items.every((i) => i.path.startsWith('/documents'))).toBe(true);
    expect(res.items.some((i) => i.path.startsWith('/system'))).toBe(false);
  });

  it('should support case sensitive and exact match', async () => {
    const insensitive = await searchEngine.search({
      query: 'REPORT',
      caseSensitive: false,
    });
    expect(insensitive.total).toBe(1);

    const sensitive = await searchEngine.search({
      query: 'REPORT',
      caseSensitive: true,
    });
    expect(sensitive.total).toBe(0);

    const exact = await searchEngine.search({
      query: 'notes.txt',
      exactMatch: true,
    });
    expect(exact.total).toBe(1);
  });

  it('should cache search results for identical queries', async () => {
    const first = await searchEngine.search({ query: 'kernel' });
    const second = await searchEngine.search({ query: 'kernel' });

    expect(first.total).toBe(second.total);
    expect(first.items[0]?.path).toBe(second.items[0]?.path);
  });

  it('should dynamically update index on VFS events via EventBus', async () => {
    // Create new file as system
    await fs.createFile('/documents/newfile.txt', { content: 'Dynamic' }, { isSystem: true });

    const res = await searchEngine.search({ query: 'newfile' });
    expect(res.total).toBe(1);
    expect(res.items[0]?.path).toBe('/documents/newfile.txt');

    // Delete file
    await fs.delete('/documents/newfile.txt', undefined, { isSystem: true });
    const afterDelete = await searchEngine.search({ query: 'newfile' });
    expect(afterDelete.total).toBe(0);
  });
});
