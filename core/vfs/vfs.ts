/**
 * WebOS Core - Virtual File System (VFS) Master Engine
 * Full POSIX-compliant virtual filesystem implementation with persistence and special filesystem integration.
 */

import { InodeTable } from './inode';
import { VFSTree, VFSTreeNode } from './vfsTree';
import { FileDescriptorTable } from './fileDescriptor';
import { Path } from './path';
import { Permissions } from './permissions';
import { VFSBuffer } from './buffer';
import { deviceManager } from './virtualDevices';
import { procFs } from './virtualProcFs';
import {
  VFSFileStat,
  VFSDirEntry,
  VFSOpenFlags,
  VFSEvent,
  StoragePersistenceAdapter,
} from './types';
import { MemoryStorageAdapter } from './vfsStorageAdapter';

export class VirtualFileSystem {
  private static instance: VirtualFileSystem;
  public inodeTable: InodeTable;
  public tree: VFSTree;
  public fdTable: FileDescriptorTable;
  public persistence: StoragePersistenceAdapter;
  private watchers: Map<string, Set<(event: VFSEvent) => void>> = new Map();
  private isInitialized: boolean = false;

  private constructor(persistenceAdapter?: StoragePersistenceAdapter) {
    this.inodeTable = new InodeTable();
    this.tree = new VFSTree(this.inodeTable);
    this.fdTable = new FileDescriptorTable();
    this.persistence = persistenceAdapter || new MemoryStorageAdapter();
    this.bootstrapSystemDirectories();
  }

  public static getInstance(persistence?: StoragePersistenceAdapter): VirtualFileSystem {
    if (!VirtualFileSystem.instance) {
      VirtualFileSystem.instance = new VirtualFileSystem(persistence);
    }
    return VirtualFileSystem.instance;
  }

  /**
   * Bootstraps the standard WebOS root filesystem tree structure.
   */
  public bootstrapSystemDirectories() {
    if (this.isInitialized) return;

    const defaultDirs = [
      '/bin',
      '/sbin',
      '/usr',
      '/usr/bin',
      '/usr/lib',
      '/etc',
      '/etc/webos',
      '/home',
      '/home/user',
      '/home/user/Desktop',
      '/home/user/Documents',
      '/home/user/Downloads',
      '/home/user/Pictures',
      '/home/user/Music',
      '/home/user/Videos',
      '/var',
      '/var/log',
      '/tmp',
      '/dev',
      '/proc',
      '/sys',
    ];

    for (const dir of defaultDirs) {
      try {
        this.mkdirp(dir);
      } catch {
        // Directory may already exist
      }
    }

    // Seed standard initial system files
    this.writeFile('/etc/os-release', 'NAME="WebOS"\nVERSION="2.0.0"\nID=webos\nPRETTY_NAME="WebOS 2.0 (Enterprise)"\n');
    this.writeFile('/etc/hostname', 'webos-workstation\n');
    this.writeFile('/etc/hosts', '127.0.0.1 localhost\n127.0.1.1 webos-workstation\n');
    this.writeFile(
      '/home/user/Desktop/Welcome.txt',
      'Welcome to WebOS 2.0!\n\nThis is a complete, browser-based operating system platform with:\n- High-performance Window Manager\n- POSIX Virtual File System\n- Real Preemptive Process Scheduler\n- Interactive Unix Terminal Shell\n- Integrated Developer Studio & App Ecosystem\n'
    );
    this.writeFile(
      '/home/user/Documents/sample.js',
      '// Sample JavaScript execution file\nfunction greet(name) {\n  return `Hello from WebOS, ${name}!`;\n}\nconsole.log(greet("Developer"));\n'
    );

    this.isInitialized = true;
  }

  public open(path: string, flags: number = VFSOpenFlags.O_RDONLY, mode: number = 0o644, processId: number = 1): number {
    const norm = Path.normalize(path);

    // Device handle check
    if (deviceManager.isDevice(norm)) {
      const desc = this.fdTable.open(0, norm, flags, processId);
      return desc.fd;
    }

    let node = this.tree.findNode(norm, true);
    if (!node) {
      if (flags & VFSOpenFlags.O_CREAT) {
        const parentPath = Path.dirname(norm);
        const name = Path.basename(norm);
        node = this.tree.insertNode(parentPath, name, 'file', mode);
        this.notifyWatchers({ type: 'create', path: norm, ino: node.ino, timestamp: Date.now() });
      } else {
        throw new Error(`ENOENT: No such file or directory '${path}'`);
      }
    }

    if (node.isDirectory && !(flags & VFSOpenFlags.O_DIRECTORY)) {
      throw new Error(`EISDIR: Is a directory '${path}'`);
    }

    const inode = this.inodeTable.get(node.ino);
    if (!inode) {
      throw new Error(`ENOENT: Stale inode for '${path}'`);
    }

    if (flags & VFSOpenFlags.O_TRUNC) {
      inode.data.truncate(0);
      inode.touchModify();
    }

    const desc = this.fdTable.open(node.ino, norm, flags, processId);
    if (flags & VFSOpenFlags.O_APPEND) {
      desc.offset = inode.data.size;
    }

    inode.touchAccess();
    return desc.fd;
  }

  public close(fd: number): boolean {
    return this.fdTable.close(fd);
  }

  public read(fd: number, buffer: Uint8Array, offset: number, length: number): number {
    const desc = this.fdTable.get(fd);
    if (!desc || !desc.readable) {
      throw new Error(`EBADF: Bad file descriptor or not readable ${fd}`);
    }

    if (deviceManager.isDevice(desc.path)) {
      const dev = deviceManager.getDevice(desc.path)!;
      const readBytes = dev.read(length, desc.offset);
      buffer.set(readBytes, offset);
      desc.offset += readBytes.length;
      return readBytes.length;
    }

    const inode = this.inodeTable.get(desc.ino);
    if (!inode) throw new Error(`ENOENT: Inode not found for fd ${fd}`);

    const bytes = inode.data.readBytes(desc.offset, length);
    buffer.set(bytes, offset);
    desc.offset += bytes.length;
    inode.touchAccess();
    return bytes.length;
  }

  public write(fd: number, buffer: Uint8Array, offset: number, length: number): number {
    const desc = this.fdTable.get(fd);
    if (!desc || !desc.writable) {
      throw new Error(`EBADF: Bad file descriptor or not writable ${fd}`);
    }

    const slice = buffer.subarray(offset, offset + length);

    if (deviceManager.isDevice(desc.path)) {
      const dev = deviceManager.getDevice(desc.path)!;
      const written = dev.write(slice, desc.offset);
      desc.offset += written;
      return written;
    }

    const inode = this.inodeTable.get(desc.ino);
    if (!inode) throw new Error(`ENOENT: Inode not found for fd ${fd}`);

    const written = inode.data.writeBytes(slice, desc.offset);
    desc.offset += written;
    inode.touchModify();

    this.notifyWatchers({ type: 'modify', path: desc.path, ino: inode.metadata.ino, timestamp: Date.now() });
    return written;
  }

  public readFile(path: string, encoding: string = 'utf-8'): string | Uint8Array {
    const norm = Path.normalize(path);

    if (procFs.isProcPath(norm)) {
      const procContent = procFs.readProcFile(norm);
      if (procContent !== null) return procContent;
      throw new Error(`ENOENT: No such proc entry '${path}'`);
    }

    const node = this.tree.findNode(norm, true);
    if (!node) {
      throw new Error(`ENOENT: No such file '${path}'`);
    }
    if (node.isDirectory) {
      throw new Error(`EISDIR: Path is a directory '${path}'`);
    }

    const inode = this.inodeTable.get(node.ino);
    if (!inode) throw new Error(`ENOENT: Inode not found`);

    inode.touchAccess();
    if (encoding === 'binary' || encoding === 'buffer') {
      return inode.data.toBytes();
    }
    return inode.data.toString(encoding);
  }

  public writeFile(path: string, data: string | Uint8Array, mode: number = 0o644): boolean {
    const norm = Path.normalize(path);
    let node = this.tree.findNode(norm, true);

    if (!node) {
      const parentPath = Path.dirname(norm);
      const name = Path.basename(norm);
      node = this.tree.insertNode(parentPath, name, 'file', mode);
      this.notifyWatchers({ type: 'create', path: norm, ino: node.ino, timestamp: Date.now() });
    }

    if (node.isDirectory) {
      throw new Error(`EISDIR: Cannot write directly to directory '${path}'`);
    }

    const inode = this.inodeTable.get(node.ino);
    if (!inode) throw new Error(`ENOENT: Inode not found`);

    const bytes = typeof data === 'string' ? VFSBuffer.fromString(data).toBytes() : data;
    inode.data.truncate(0);
    inode.data.writeBytes(bytes, 0);
    inode.touchModify();

    this.notifyWatchers({ type: 'modify', path: norm, ino: inode.metadata.ino, timestamp: Date.now() });
    return true;
  }

  public appendFile(path: string, data: string | Uint8Array): boolean {
    const norm = Path.normalize(path);
    const existing = this.exists(norm) ? this.readFile(norm, 'binary') as Uint8Array : new Uint8Array(0);
    const appendBytes = typeof data === 'string' ? VFSBuffer.fromString(data).toBytes() : data;

    const merged = new Uint8Array(existing.length + appendBytes.length);
    merged.set(existing, 0);
    merged.set(appendBytes, existing.length);

    return this.writeFile(norm, merged);
  }

  public mkdir(path: string, mode: number = 0o755): VFSTreeNode {
    const norm = Path.normalize(path);
    const parentPath = Path.dirname(norm);
    const name = Path.basename(norm);

    const node = this.tree.insertNode(parentPath, name, 'directory', mode);
    this.notifyWatchers({ type: 'create', path: norm, ino: node.ino, timestamp: Date.now() });
    return node;
  }

  public mkdirp(path: string, mode: number = 0o755): VFSTreeNode {
    const norm = Path.normalize(path);
    const segments = Path.split(norm);

    let currentPath = '';
    let currentNode = this.tree.root;

    for (const seg of segments) {
      currentPath = currentPath === '' ? `/${seg}` : `${currentPath}/${seg}`;
      let next = this.tree.findNode(currentPath);
      if (!next) {
        const parentPath = Path.dirname(currentPath);
        next = this.tree.insertNode(parentPath, seg, 'directory', mode);
        this.notifyWatchers({ type: 'create', path: currentPath, ino: next.ino, timestamp: Date.now() });
      }
      currentNode = next;
    }

    return currentNode;
  }

  public rmdir(path: string): boolean {
    const norm = Path.normalize(path);
    const node = this.tree.findNode(norm);
    if (!node) throw new Error(`ENOENT: No such directory '${path}'`);
    if (!node.isDirectory) throw new Error(`ENOTDIR: Not a directory '${path}'`);

    const ino = node.ino;
    const success = this.tree.deleteNode(norm);
    if (success) {
      this.notifyWatchers({ type: 'delete', path: norm, ino, timestamp: Date.now() });
    }
    return success;
  }

  public unlink(path: string): boolean {
    const norm = Path.normalize(path);
    const node = this.tree.findNode(norm);
    if (!node) throw new Error(`ENOENT: No such file '${path}'`);
    if (node.isDirectory) throw new Error(`EISDIR: Cannot unlink a directory '${path}', use rmdir`);

    const ino = node.ino;
    const success = this.tree.deleteNode(norm);
    if (success) {
      this.notifyWatchers({ type: 'delete', path: norm, ino, timestamp: Date.now() });
    }
    return success;
  }

  public stat(path: string): VFSFileStat {
    const norm = Path.normalize(path);

    if (procFs.isProcPath(norm)) {
      const entries = procFs.listProcEntries(norm);
      const isDir = entries.length > 0 || norm === '/proc';
      return this.createStatObject({
        ino: 9999,
        type: isDir ? 'directory' : 'file',
        size: 0,
        blocks: 0,
        nlink: 1,
        uid: 0,
        gid: 0,
        mode: isDir ? 0o755 : 0o444,
        atime: Date.now(),
        mtime: Date.now(),
        ctime: Date.now(),
        birthtime: Date.now(),
      }, Path.basename(norm), norm);
    }

    const node = this.tree.findNode(norm, true);
    if (!node) throw new Error(`ENOENT: No such file or directory '${path}'`);

    const inode = this.inodeTable.get(node.ino);
    if (!inode) throw new Error(`ENOENT: Inode not found`);

    return this.createStatObject(inode.metadata, node.name, norm);
  }

  private createStatObject(m: InodeTable['get'] extends (ino: number) => infer T ? T extends { metadata: infer M } ? M : any : any, name: string, path: string): VFSFileStat {
    return {
      ino: m.ino,
      name,
      path,
      type: m.type,
      size: m.size,
      blocks: m.blocks,
      nlink: m.nlink,
      uid: m.uid,
      gid: m.gid,
      mode: m.mode,
      modeString: Permissions.toModeString(m.mode, m.type),
      atime: new Date(m.atime),
      mtime: new Date(m.mtime),
      ctime: new Date(m.ctime),
      birthtime: new Date(m.birthtime),
      isDirectory: () => m.type === 'directory',
      isFile: () => m.type === 'file',
      isSymbolicLink: () => m.type === 'symlink',
      isDevice: () => m.type === 'device',
    };
  }

  public readdir(path: string): VFSDirEntry[] {
    const norm = Path.normalize(path);

    if (procFs.isProcPath(norm)) {
      const names = procFs.listProcEntries(norm);
      return names.map((name, i) => ({
        name,
        ino: 9000 + i,
        type: name === 'self' || name === '1' ? 'directory' : 'file',
        size: 0,
        mtime: Date.now(),
        path: Path.join(norm, name),
      }));
    }

    const node = this.tree.findNode(norm, true);
    if (!node) throw new Error(`ENOENT: Directory not found '${path}'`);
    if (!node.isDirectory) throw new Error(`ENOTDIR: Not a directory '${path}'`);

    const entries: VFSDirEntry[] = [];
    for (const child of node.children.values()) {
      const inode = this.inodeTable.get(child.ino);
      entries.push({
        name: child.name,
        ino: child.ino,
        type: child.type,
        size: inode?.metadata.size ?? 0,
        mtime: inode?.metadata.mtime ?? Date.now(),
        path: child.getFullPath(),
      });
    }

    return entries;
  }

  public exists(path: string): boolean {
    const norm = Path.normalize(path);
    if (procFs.isProcPath(norm)) return true;
    if (deviceManager.isDevice(norm)) return true;
    return this.tree.findNode(norm, true) !== null;
  }

  public copyFile(sourcePath: string, destPath: string): boolean {
    const content = this.readFile(sourcePath, 'binary') as Uint8Array;
    return this.writeFile(destPath, content);
  }

  public rename(oldPath: string, newPath: string): boolean {
    const oldNorm = Path.normalize(oldPath);
    const newNorm = Path.normalize(newPath);

    const oldNode = this.tree.findNode(oldNorm, false);
    if (!oldNode) throw new Error(`ENOENT: Source not found '${oldPath}'`);

    const newParentPath = Path.dirname(newNorm);
    const newName = Path.basename(newNorm);

    const newParent = this.tree.findNode(newParentPath, true);
    if (!newParent || !newParent.isDirectory) {
      throw new Error(`ENOENT: Destination directory not found '${newParentPath}'`);
    }

    // Remove from old parent
    if (oldNode.parent) {
      oldNode.parent.removeChild(oldNode.name);
    }

    // Add to new parent with new name
    oldNode.name = newName;
    newParent.addChild(oldNode);

    this.notifyWatchers({ type: 'rename', path: newNorm, ino: oldNode.ino, timestamp: Date.now() });
    return true;
  }

  public chmod(path: string, mode: number): boolean {
    const node = this.tree.findNode(Path.normalize(path), true);
    if (!node) throw new Error(`ENOENT: File not found '${path}'`);
    const inode = this.inodeTable.get(node.ino);
    if (!inode) return false;
    inode.metadata.mode = mode & 0o7777;
    inode.touchStatus();
    this.notifyWatchers({ type: 'chmod', path, ino: node.ino, timestamp: Date.now() });
    return true;
  }

  public chown(path: string, uid: number, gid: number): boolean {
    const node = this.tree.findNode(Path.normalize(path), true);
    if (!node) throw new Error(`ENOENT: File not found '${path}'`);
    const inode = this.inodeTable.get(node.ino);
    if (!inode) return false;
    inode.metadata.uid = uid;
    inode.metadata.gid = gid;
    inode.touchStatus();
    this.notifyWatchers({ type: 'chown', path, ino: node.ino, timestamp: Date.now() });
    return true;
  }

  public symlink(target: string, linkPath: string): VFSTreeNode {
    const norm = Path.normalize(linkPath);
    const parentPath = Path.dirname(norm);
    const name = Path.basename(norm);

    const node = this.tree.insertNode(parentPath, name, 'symlink', 0o777);
    const inode = this.inodeTable.get(node.ino);
    if (inode) {
      inode.symlinkTarget = target;
    }
    this.notifyWatchers({ type: 'create', path: norm, ino: node.ino, timestamp: Date.now() });
    return node;
  }

  public readlink(path: string): string {
    const node = this.tree.findNode(Path.normalize(path), false);
    if (!node) throw new Error(`ENOENT: Link not found '${path}'`);
    if (node.type !== 'symlink') throw new Error(`EINVAL: Not a symlink '${path}'`);

    const inode = this.inodeTable.get(node.ino);
    if (!inode || !inode.symlinkTarget) throw new Error(`ENOENT: Broken symlink target`);
    return inode.symlinkTarget;
  }

  public watch(path: string, listener: (event: VFSEvent) => void): () => void {
    const norm = Path.normalize(path);
    if (!this.watchers.has(norm)) {
      this.watchers.set(norm, new Set());
    }
    this.watchers.get(norm)!.add(listener);

    return () => {
      this.watchers.get(norm)?.delete(listener);
    };
  }

  private notifyWatchers(event: VFSEvent) {
    const exact = this.watchers.get(event.path);
    if (exact) {
      exact.forEach((l) => {
        try {
          l(event);
        } catch (e) {
          console.error('VFS watcher error:', e);
        }
      });
    }

    const parentPath = Path.dirname(event.path);
    const parentWatcher = this.watchers.get(parentPath);
    if (parentWatcher) {
      parentWatcher.forEach((l) => {
        try {
          l(event);
        } catch (e) {
          console.error('VFS parent watcher error:', e);
        }
      });
    }
  }
}

export const vfs = VirtualFileSystem.getInstance();
