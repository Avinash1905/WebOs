import { describe, it, expect } from 'vitest';
import {
  Ext2SuperBlock,
  DirectoryHashTable,
  ExtendedAttributes,
  PathTraversalTree,
  SparseFileManager,
  PipeFileSystem
} from '../../core/filesystem/index.js';

describe('VFS Deep Subsystems', () => {
  describe('Ext2SuperBlock', () => {
    it('should allocate and free blocks and inodes', () => {
      const sb = new Ext2SuperBlock(100, 200, 4096);
      const block1 = sb.allocateBlock();
      const inode1 = sb.allocateInode();

      expect(block1).toBe(1);
      expect(inode1).toBe(1);
      expect(sb.getSummary().freeBlocksCount).toBe(199);
      expect(sb.getSummary().freeInodesCount).toBe(99);

      sb.freeBlock();
      sb.freeInode();
      expect(sb.getSummary().freeBlocksCount).toBe(200);
    });
  });

  describe('DirectoryHashTable', () => {
    it('should insert, lookup, and delete directory entries in O(1)', () => {
      const table = new DirectoryHashTable();
      table.insert('index.html', 1001);
      table.insert('style.css', 1002);

      expect(table.lookup('index.html')).toBe(1001);
      expect(table.size()).toBe(2);

      table.remove('style.css');
      expect(table.lookup('style.css')).toBeUndefined();
    });
  });

  describe('ExtendedAttributes', () => {
    it('should manage extended attributes on file paths', () => {
      const xattr = new ExtendedAttributes();
      xattr.setXAttr('/home/user/doc.pdf', 'user.tags', 'finance,report');
      xattr.setXAttr('/home/user/doc.pdf', 'security.selinux', 'user_u:object_r:doc_t:s0');

      expect(xattr.getXAttr('/home/user/doc.pdf', 'user.tags')).toBe('finance,report');
      expect(xattr.listXAttrs('/home/user/doc.pdf')).toContain('security.selinux');

      xattr.removeXAttr('/home/user/doc.pdf', 'user.tags');
      expect(xattr.getXAttr('/home/user/doc.pdf', 'user.tags')).toBeUndefined();
    });
  });

  describe('PathTraversalTree', () => {
    it('should index hierarchical paths and match prefix trees', () => {
      const trie = new PathTraversalTree();
      trie.insertPath('/home/user/Documents/report.txt');
      trie.insertPath('/home/user/Documents/invoice.pdf');
      trie.insertPath('/home/user/Downloads/setup.exe');

      const docMatches = trie.matchPrefix('/home/user/Documents');
      expect(docMatches).toContain('/home/user/Documents/report.txt');
      expect(docMatches).toContain('/home/user/Documents/invoice.pdf');
      expect(docMatches).not.toContain('/home/user/Downloads/setup.exe');
    });
  });

  describe('SparseFileManager', () => {
    it('should support sparse allocations and block hole punching', () => {
      const sparse = new SparseFileManager(4096);
      sparse.setLength(1024 * 1024); // 1MB virtual file length

      // Write at 0 (1 block)
      sparse.writeAt(0, new Uint8Array(100));
      // Write at 500KB (1 block)
      sparse.writeAt(500 * 1024, new Uint8Array(100));

      expect(sparse.getVirtualLength()).toBeGreaterThanOrEqual(500 * 1024);
      expect(sparse.getActualBytesAllocated()).toBe(8192); // Only 2 blocks allocated (8KB)

      sparse.punchHole(0, 4096);
      expect(sparse.getActualBytesAllocated()).toBe(4096); // 1 block remaining
    });
  });

  describe('PipeFileSystem', () => {
    it('should create and transfer data via virtual FIFO pipes', () => {
      const fifo = new PipeFileSystem();
      fifo.createFIFO('sys_pipe', 1024);

      const msg = new TextEncoder().encode('FIFO_PIPE_DATA');
      fifo.writeFIFO('sys_pipe', msg);

      const readBack = fifo.readFIFO('sys_pipe', 64);
      expect(new TextDecoder().decode(readBack)).toBe('FIFO_PIPE_DATA');
    });
  });
});
