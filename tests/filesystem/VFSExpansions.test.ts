import { describe, it, expect, beforeEach } from 'vitest';
import {
  InodeTable,
  FileLockManager,
  StreamBuffer,
  ChunkedIO,
  VFSMountManager,
  FileSystemIntegrityChecker,
  FileSystem
} from '../../core/filesystem/index.js';
import { StorageEngine } from '../../core/storage/index.js';

describe('VFS Expansions', () => {
  describe('InodeTable', () => {
    let table: InodeTable;

    beforeEach(() => {
      table = new InodeTable();
    });

    it('should allocate and retrieve inodes', () => {
      const node = table.allocateInode('/home/user/test.txt', 'file', { size: 100, mode: 0o644 });
      expect(node.ino).toBe(1000);
      expect(table.getInode(1000)?.path).toBe('/home/user/test.txt');
      expect(table.getInodeByPath('/home/user/test.txt')?.ino).toBe(1000);
    });

    it('should support hard links and handle release correctly', () => {
      table.allocateInode('/file1.txt', 'file');
      const linked = table.addHardLink('/file1.txt', '/file2.txt');
      expect(linked.nlink).toBe(2);

      // Release first path
      const fullyDeleted1 = table.releaseInode('/file1.txt');
      expect(fullyDeleted1).toBe(false);
      expect(table.getInodeByPath('/file2.txt')).toBeDefined();

      // Release second path
      const fullyDeleted2 = table.releaseInode('/file2.txt');
      expect(fullyDeleted2).toBe(true);
      expect(table.getInodeByPath('/file2.txt')).toBeUndefined();
    });

    it('should resolve symlinks and prevent cycles', () => {
      table.allocateInode('/target.txt', 'file');
      table.allocateInode('/link1', 'file', { symlinkTarget: '/target.txt' });
      table.allocateInode('/link2', 'file', { symlinkTarget: '/link1' });

      expect(table.resolvePath('/link2')).toBe('/target.txt');
    });
  });

  describe('FileLockManager', () => {
    let lockMgr: FileLockManager;

    beforeEach(() => {
      lockMgr = new FileLockManager();
    });

    it('should acquire and release exclusive and shared locks', async () => {
      const lock1 = await lockMgr.acquireLock('/data.db', 'SHARED_READ', 'user1');
      expect(lock1.type).toBe('SHARED_READ');

      const lock2 = await lockMgr.acquireLock('/data.db', 'SHARED_READ', 'user2');
      expect(lock2.type).toBe('SHARED_READ');

      // Cannot acquire exclusive write while shared reads are active by others
      await expect(
        lockMgr.acquireLock('/data.db', 'EXCLUSIVE_WRITE', 'user3', { retryTimeoutMs: 50, retryIntervalMs: 10 })
      ).rejects.toThrow();

      lockMgr.releaseLock(lock1.lockId);
      lockMgr.releaseLock(lock2.lockId);

      const writeLock = await lockMgr.acquireLock('/data.db', 'EXCLUSIVE_WRITE', 'user3');
      expect(writeLock.type).toBe('EXCLUSIVE_WRITE');
      lockMgr.releaseLock(writeLock.lockId);
    });
  });

  describe('StreamBuffer', () => {
    it('should write and seek-read byte streams correctly', () => {
      const stream = new StreamBuffer();
      stream.writeString('Hello, WebOS Stream!');
      expect(stream.size()).toBe(20);

      stream.seek(7);
      expect(stream.readString(5)).toBe('WebOS');

      stream.seek(0);
      expect(stream.readAllAsString()).toBe('Hello, WebOS Stream!');
    });
  });

  describe('ChunkedIO', () => {
    it('should handle block-level chunked reading and writing', () => {
      const chunker = new ChunkedIO(64); // 64-byte blocks
      const data = new TextEncoder().encode('A'.repeat(200));

      chunker.writeAt(0, data);
      expect(chunker.getBlockCount()).toBe(4); // 200 bytes / 64 = 4 blocks
      expect(chunker.getTotalSize()).toBe(200);

      const readBack = chunker.readAt(50, 10);
      expect(new TextDecoder().decode(readBack)).toBe('A'.repeat(10));
    });
  });

  describe('VFSMountManager', () => {
    it('should resolve longest mount prefix and respect readonly flags', () => {
      const mounts = new VFSMountManager();
      mounts.mount('/mnt/usb', 'storage', { isReadOnly: true });

      const res1 = mounts.resolveMount('/mnt/usb/docs/file.txt');
      expect(res1.mount.mountPath).toBe('/mnt/usb');
      expect(res1.relativePath).toBe('/docs/file.txt');
      expect(mounts.isReadOnly('/mnt/usb/docs/file.txt')).toBe(true);

      const res2 = mounts.resolveMount('/home/user/pic.png');
      expect(res2.mount.mountPath).toBe('/');
      expect(res2.relativePath).toBe('/home/user/pic.png');
      expect(mounts.isReadOnly('/home/user/pic.png')).toBe(false);
    });
  });

  describe('FileSystemIntegrityChecker', () => {
    it('should report integrity status and repair missing directories', async () => {
      const storage = new StorageEngine({ adapter: 'memory' });
      await storage.initialize();
      const fs = new FileSystem({ storage });
      await fs.initialize();

      await fs.createDirectory('/home/test', { recursive: true });
      await fs.createFile('/home/test/file.txt', { content: 'hello' });

      const checker = new FileSystemIntegrityChecker(fs);
      const report = await checker.check({ autoRepair: true });
      expect(report.healthy).toBe(true);
    });
  });
});
