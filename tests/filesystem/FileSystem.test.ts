import { describe, expect, it } from 'vitest';
import { EventBus } from '../../core/events/index.js';
import {
  DirectoryAlreadyExistsError,
  DirectoryCycleError,
  FileAlreadyExistsError,
  FileNotFoundError,
  FileSystem,
  InvalidNameError,
  IsADirectoryError,
  PathResolver,
  RootOperationError,
} from '../../core/filesystem/index.js';
import { Kernel } from '../../core/kernel/index.js';
import { StorageEngine } from '../../core/storage/index.js';

describe('Virtual File System (Module 4)', () => {
  // =========================================================================
  // 1. Initialization & Root Structure
  // =========================================================================
  describe('Initialization & Root Structure', () => {
    it('initializes root directory and default directory structure', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      expect(fs.exists('/')).resolves.toBe(true);
      expect(fs.exists('/home')).resolves.toBe(true);
      expect(fs.exists('/home/user/Documents')).resolves.toBe(true);
      expect(fs.exists('/applications')).resolves.toBe(true);
      expect(fs.exists('/system')).resolves.toBe(true);

      const root = fs.getRoot();
      expect(root.path).toBe('/');
      expect(root.type).toBe('directory');
      expect(root.parentId).toBeNull();
    });

    it('protects root directory against deletion, renaming, or moving', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await expect(fs.delete('/')).rejects.toThrowError(RootOperationError);
      await expect(fs.rename('/', 'newroot')).rejects.toThrowError(RootOperationError);
      await expect(fs.move('/', '/sub')).rejects.toThrowError(RootOperationError);
    });
  });

  // =========================================================================
  // 2. Path Resolver & Sandbox Security
  // =========================================================================
  describe('Path Resolver & Sandboxing', () => {
    it('normalizes redundant slashes, dot, and dot-dot segments', () => {
      expect(PathResolver.normalize('///home//user/../user///Documents/.')).toBe(
        '/home/user/Documents'
      );
      expect(PathResolver.normalize('home/user')).toBe('/home/user');
      expect(PathResolver.normalize('/')).toBe('/');
    });

    it('prevents path traversal outside root sandbox', () => {
      expect(PathResolver.normalize('/../../../outside')).toBe('/outside');
      expect(PathResolver.normalize('../../../')).toBe('/');
    });

    it('resolves dirname, basename, and extname accurately', () => {
      expect(PathResolver.dirname('/home/user/report.txt')).toBe('/home/user');
      expect(PathResolver.dirname('/home')).toBe('/');
      expect(PathResolver.dirname('/')).toBe('/');

      expect(PathResolver.basename('/home/user/report.txt')).toBe('report.txt');
      expect(PathResolver.basename('/')).toBe('');

      expect(PathResolver.extname('/home/user/report.txt')).toBe('.txt');
      expect(PathResolver.extname('/home/user')).toBe('');
      expect(PathResolver.extname('/archive.tar.gz')).toBe('.gz');
    });

    it('validates file and directory names', () => {
      expect(() => PathResolver.validateName('')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('   ')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('.')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('..')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('dir/file')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('dir\\file')).toThrowError(InvalidNameError);
      expect(() => PathResolver.validateName('valid_name-123.txt')).not.toThrow();
    });
  });

  // =========================================================================
  // 3. File CRUD Operations
  // =========================================================================
  describe('File CRUD Operations', () => {
    it('creates and reads text, JSON, and binary files', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      // Text file
      await fs.createFile('/home/user/Documents/note.txt', {
        content: 'Hello WebOS',
      });
      expect(await fs.exists('/home/user/Documents/note.txt')).toBe(true);
      const textContent = await fs.readFile('/home/user/Documents/note.txt');
      expect(textContent).toBe('Hello WebOS');

      // JSON file
      const configData = { theme: 'dark', fontSize: 14 };
      await fs.createFile('/home/user/config.json', {
        content: configData,
      });
      const parsedJson = await fs.readFile('/home/user/config.json', { encoding: 'json' });
      expect(parsedJson).toEqual(configData);

      // Binary file
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      await fs.createFile('/home/user/data.bin', {
        content: binaryData,
      });
      const readBinary = await fs.readFile('/home/user/data.bin', { encoding: 'binary' });
      expect(readBinary).toBeInstanceOf(Uint8Array);
      expect(Array.from(readBinary as Uint8Array)).toEqual([1, 2, 3, 4, 5]);
    });

    it('updates file content and recalculates byte size and timestamp', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      const created = await fs.createFile('/home/user/log.txt', { content: 'start' });
      expect(created.size).toBe(5);

      const updated = await fs.writeFile('/home/user/log.txt', 'updated content with more text');
      expect(updated.size).toBe(30);
      expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
      expect(await fs.readFile('/home/user/log.txt')).toBe('updated content with more text');
    });

    it('appends text to an existing file', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createFile('/home/user/log.txt', { content: 'Line 1\n' });
      await fs.appendFile('/home/user/log.txt', 'Line 2\n');

      const content = await fs.readFile('/home/user/log.txt');
      expect(content).toBe('Line 1\nLine 2\n');
    });

    it('throws FileAlreadyExistsError when creating duplicate file without overwrite', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createFile('/home/user/file.txt', { content: 'first' });
      await expect(fs.createFile('/home/user/file.txt')).rejects.toThrowError(
        FileAlreadyExistsError
      );
    });

    it('throws FileNotFoundError when reading non-existent file', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await expect(fs.readFile('/nonexistent.txt')).rejects.toThrowError(FileNotFoundError);
    });

    it('throws IsADirectoryError when attempting to read a directory as a file', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await expect(fs.readFile('/home/user')).rejects.toThrowError(IsADirectoryError);
    });
  });

  // =========================================================================
  // 4. Directory Operations & Listing
  // =========================================================================
  describe('Directory Operations', () => {
    it('creates directories and lists contents with sorting and filtering', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createDirectory('/home/user/Projects');
      await fs.createFile('/home/user/Projects/b_file.txt', { content: 'bbb' });
      await fs.createFile('/home/user/Projects/a_file.txt', { content: 'a' });
      await fs.createFile('/home/user/Projects/.hidden.txt', { content: 'hidden' });
      await fs.createDirectory('/home/user/Projects/subfolder');

      // Default list (excludes hidden)
      const list = await fs.listDirectory('/home/user/Projects');
      expect(list.map((item) => item.name)).toEqual(['a_file.txt', 'b_file.txt', 'subfolder']);

      // List with hidden files
      const listAll = await fs.listDirectory('/home/user/Projects', { includeHidden: true });
      expect(listAll.map((item) => item.name)).toContain('.hidden.txt');

      // Sort by size desc
      const bySize = await fs.listDirectory('/home/user/Projects', {
        sortBy: 'size',
        sortOrder: 'desc',
      });
      expect(bySize[0]?.name).toBe('b_file.txt');
    });

    it('throws DirectoryAlreadyExistsError when creating existing directory', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await expect(fs.createDirectory('/home/user/Documents')).rejects.toThrowError(
        DirectoryAlreadyExistsError
      );
    });

    it('recursively lists descendants of a directory', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createDirectory('/home/user/Documents/sub');
      await fs.createFile('/home/user/Documents/sub/file1.txt', { content: '1' });
      await fs.createFile('/home/user/Documents/file2.txt', { content: '2' });

      const descendants = await fs.listDirectory('/home/user/Documents', { recursive: true });
      const paths = descendants.map((d) => d.path);

      expect(paths).toContain('/home/user/Documents/sub');
      expect(paths).toContain('/home/user/Documents/sub/file1.txt');
      expect(paths).toContain('/home/user/Documents/file2.txt');
    });
  });

  // =========================================================================
  // 5. Rename, Move, Copy, Delete
  // =========================================================================
  describe('Rename, Move, Copy, and Delete', () => {
    it('renames files and updates directory descendant paths', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      // File rename
      await fs.createFile('/home/user/old.txt', { content: 'content' });
      const renamedFile = await fs.rename('/home/user/old.txt', 'new.txt');
      expect(renamedFile.path).toBe('/home/user/new.txt');
      expect(await fs.exists('/home/user/old.txt')).toBe(false);
      expect(await fs.exists('/home/user/new.txt')).toBe(true);

      // Directory rename
      await fs.createDirectory('/home/user/OldFolder');
      await fs.createFile('/home/user/OldFolder/item.txt', { content: 'nested' });

      await fs.rename('/home/user/OldFolder', 'NewFolder');
      expect(await fs.exists('/home/user/OldFolder')).toBe(false);
      expect(await fs.exists('/home/user/NewFolder')).toBe(true);
      expect(await fs.exists('/home/user/NewFolder/item.txt')).toBe(true);
      expect(await fs.readFile('/home/user/NewFolder/item.txt')).toBe('nested');
    });

    it('moves files and folders and prevents directory cycle nesting', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createFile('/home/user/report.txt', { content: 'report' });
      await fs.move('/home/user/report.txt', '/home/user/Documents');

      expect(await fs.exists('/home/user/report.txt')).toBe(false);
      expect(await fs.exists('/home/user/Documents/report.txt')).toBe(true);

      // Directory cycle prevention
      await fs.createDirectory('/home/user/DirA');
      await fs.createDirectory('/home/user/DirA/DirB');

      await expect(fs.move('/home/user/DirA', '/home/user/DirA/DirB')).rejects.toThrowError(
        DirectoryCycleError
      );
    });

    it('copies files and directories with recursive subtree duplication', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createFile('/home/user/source.txt', { content: 'copy me' });
      const copied = await fs.copy('/home/user/source.txt', '/home/user/Documents/dest.txt');

      expect(copied.path).toBe('/home/user/Documents/dest.txt');
      expect(await fs.readFile('/home/user/source.txt')).toBe('copy me');
      expect(await fs.readFile('/home/user/Documents/dest.txt')).toBe('copy me');

      // Directory copy
      await fs.createDirectory('/home/user/Template');
      await fs.createFile('/home/user/Template/file.txt', { content: 'template content' });

      await fs.copy('/home/user/Template', '/home/user/Documents/Instantiated');
      expect(await fs.exists('/home/user/Documents/Instantiated/file.txt')).toBe(true);
      expect(await fs.readFile('/home/user/Documents/Instantiated/file.txt')).toBe(
        'template content'
      );
    });

    it('deletes files and recursively deletes directories', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createDirectory('/home/user/ToDelete');
      await fs.createFile('/home/user/ToDelete/f1.txt', { content: '1' });
      await fs.createFile('/home/user/ToDelete/f2.txt', { content: '2' });

      await fs.delete('/home/user/ToDelete');

      expect(await fs.exists('/home/user/ToDelete')).toBe(false);
      expect(await fs.exists('/home/user/ToDelete/f1.txt')).toBe(false);
      expect(await fs.exists('/home/user/ToDelete/f2.txt')).toBe(false);
    });
  });

  // =========================================================================
  // 6. Search
  // =========================================================================
  describe('File Search', () => {
    it('searches by name, extension, type, and path prefix', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createFile('/home/user/Documents/report_final.docx', { content: 'doc' });
      await fs.createFile('/home/user/Documents/report_draft.txt', { content: 'txt' });
      await fs.createFile('/home/user/Downloads/setup.exe', { content: 'exe' });

      const nameResults = await fs.search('report');
      expect(nameResults.length).toBe(2);

      const extResults = await fs.search({ extension: '.txt' });
      expect(extResults.length).toBe(1);
      expect(extResults[0]?.name).toBe('report_draft.txt');

      const prefixResults = await fs.search({ pathPrefix: '/home/user/Downloads' });
      expect(prefixResults.length).toBe(1);
      expect(prefixResults[0]?.name).toBe('setup.exe');
    });
  });

  // =========================================================================
  // 7. File Watchers
  // =========================================================================
  describe('File Watchers', () => {
    it('notifies watchers on file creation, update, rename, and delete', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      const fs = new FileSystem({ storage });
      await fs.initialize();

      const events: string[] = [];
      const unsub = fs.watch('/home/user/Documents', (e) => {
        events.push(`${e.type}:${e.path}`);
      });

      await fs.createFile('/home/user/Documents/live.txt', { content: 'init' });
      await fs.writeFile('/home/user/Documents/live.txt', 'updated');
      await fs.rename('/home/user/Documents/live.txt', 'renamed.txt');
      await fs.delete('/home/user/Documents/renamed.txt');

      expect(events).toEqual([
        'created:/home/user/Documents/live.txt',
        'updated:/home/user/Documents/live.txt',
        'renamed:/home/user/Documents/renamed.txt',
        'deleted:/home/user/Documents/renamed.txt',
      ]);

      unsub();
      await fs.createFile('/home/user/Documents/silent.txt', { content: 'no event' });
      expect(events.length).toBe(4); // No new event after unsub
    });
  });

  // =========================================================================
  // 8. Event Bus & Persistence Across Restarts
  // =========================================================================
  describe('Event Bus & Persistence', () => {
    it('emits filesystem events through EventBus', async () => {
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });
      const fs = new FileSystem({ storage, eventBus });
      await fs.initialize();

      const emitted: string[] = [];
      eventBus.subscribe('FILE_CREATED', (p) => {
        emitted.push(`created:${p.path}`);
      });
      eventBus.subscribe('FILE_UPDATED', (p) => {
        emitted.push(`updated:${p.path}`);
      });
      eventBus.subscribe('FILE_DELETED', (p) => {
        emitted.push(`deleted:${p.path}`);
      });

      await fs.createFile('/home/user/Documents/evt.txt', { content: 'test' });
      await fs.writeFile('/home/user/Documents/evt.txt', 'updated test');
      await fs.delete('/home/user/Documents/evt.txt');

      expect(emitted).toEqual([
        'created:/home/user/Documents/evt.txt',
        'updated:/home/user/Documents/evt.txt',
        'deleted:/home/user/Documents/evt.txt',
      ]);
    });

    it('rehydrates directory tree and persists files across restarts', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });

      // First run: create files
      const fs1 = new FileSystem({ storage });
      await fs1.initialize();
      await fs1.createDirectory('/home/user/PersistentFolder');
      await fs1.createFile('/home/user/PersistentFolder/data.txt', { content: 'Persisted WebOS Data' });

      // Simulate restart: new FileSystem instance pointing to same storage
      const fs2 = new FileSystem({ storage });
      await fs2.initialize();

      expect(await fs2.exists('/home/user/PersistentFolder')).toBe(true);
      expect(await fs2.exists('/home/user/PersistentFolder/data.txt')).toBe(true);

      const content = await fs2.readFile('/home/user/PersistentFolder/data.txt');
      expect(content).toBe('Persisted WebOS Data');
    });
  });

  // =========================================================================
  // 9. Kernel Lifecycle Integration
  // =========================================================================
  describe('Kernel Integration', () => {
    it('orchestrates FileSystem alongside EventBus and StorageEngine in Kernel', async () => {
      const kernel = new Kernel();
      const eventBus = new EventBus();
      const storage = new StorageEngine({ adapter: 'memory', eventBus });
      const fs = new FileSystem({ storage, eventBus });

      kernel.registerService(eventBus);
      kernel.registerService(storage);
      kernel.registerService(fs);

      expect(fs.name).toBe('filesystem');
      expect(fs.getStatus()).toBe('REGISTERED');

      await kernel.initialize();
      expect(fs.getStatus()).toBe('INITIALIZED');

      await kernel.start();
      expect(fs.getStatus()).toBe('RUNNING');

      // Test operation while kernel is running
      await fs.createFile('/home/user/Documents/kernel_doc.txt', { content: 'running' });
      expect(await fs.exists('/home/user/Documents/kernel_doc.txt')).toBe(true);

      await kernel.stop();
      expect(fs.getStatus()).toBe('STOPPED');
    });
  });
});
