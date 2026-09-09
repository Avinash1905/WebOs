/**
 * @file InodeTable.ts
 * @description POSIX-style Inode Table and Index Node Management for WebOS VFS.
 */

import type { FileSystemNodeType } from './types.js';
import { FileSystemError } from './FileSystemError.js';

export interface InodeDescriptor {
  readonly ino: number;
  readonly type: FileSystemNodeType;
  readonly path: string;
  readonly size: number;
  readonly mode: number;
  readonly uid: string;
  readonly gid: string;
  readonly nlink: number;
  readonly atime: number;
  readonly mtime: number;
  readonly ctime: number;
  readonly directBlocks: readonly string[];
  readonly symlinkTarget?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export class InodeTable {
  private nextIno = 1000;
  private readonly inodes = new Map<number, InodeDescriptor>();
  private readonly pathToIno = new Map<string, number>();
  private readonly symlinks = new Map<string, string>();

  constructor(initialNextIno = 1000) {
    this.nextIno = initialNextIno;
    // Allocate root directory inode 1
    this.allocateInode('/', 'directory', { mode: 0o755, uid: 'root', gid: 'root' }, 1);
  }

  public allocateInode(
    path: string,
    type: FileSystemNodeType,
    options?: {
      mode?: number;
      uid?: string;
      gid?: string;
      size?: number;
      symlinkTarget?: string;
      attributes?: Record<string, unknown>;
    },
    forcedIno?: number
  ): InodeDescriptor {
    const ino = forcedIno ?? this.nextIno++;
    const now = Date.now();

    const desc: InodeDescriptor = {
      ino,
      type,
      path,
      size: options?.size ?? 0,
      mode: options?.mode ?? (type === 'directory' ? 0o755 : 0o644),
      uid: options?.uid ?? 'system',
      gid: options?.gid ?? 'system',
      nlink: 1,
      atime: now,
      mtime: now,
      ctime: now,
      directBlocks: [],
      symlinkTarget: options?.symlinkTarget,
      attributes: Object.freeze({ ...(options?.attributes ?? {}) })
    };

    this.inodes.set(ino, desc);
    this.pathToIno.set(path, ino);

    if (options?.symlinkTarget) {
      this.symlinks.set(path, options.symlinkTarget);
    }

    return desc;
  }

  public getInode(ino: number): InodeDescriptor | undefined {
    return this.inodes.get(ino);
  }

  public getInodeByPath(path: string): InodeDescriptor | undefined {
    const ino = this.pathToIno.get(path);
    if (ino === undefined) return undefined;
    return this.inodes.get(ino);
  }

  public resolvePath(path: string, maxDepth = 16): string {
    let current = path;
    let depth = 0;

    while (this.symlinks.has(current)) {
      if (depth++ > maxDepth) {
        throw new FileSystemError('ELOOP', `Too many levels of symbolic links: ${path}`);
      }
      current = this.symlinks.get(current)!;
    }

    return current;
  }

  public addHardLink(existingPath: string, newPath: string): InodeDescriptor {
    const ino = this.pathToIno.get(existingPath);
    if (!ino) {
      throw new FileSystemError('ENOENT', `Source path ${existingPath} does not exist`);
    }

    const desc = this.inodes.get(ino)!;
    if (desc.type === 'directory') {
      throw new FileSystemError('EPERM', 'Hard links to directories are not permitted');
    }

    const updated: InodeDescriptor = {
      ...desc,
      nlink: desc.nlink + 1,
      ctime: Date.now()
    };

    this.inodes.set(ino, updated);
    this.pathToIno.set(newPath, ino);
    return updated;
  }

  public releaseInode(path: string): boolean {
    const ino = this.pathToIno.get(path);
    if (!ino) return false;

    this.pathToIno.delete(path);
    this.symlinks.delete(path);

    const desc = this.inodes.get(ino);
    if (!desc) return false;

    if (desc.nlink <= 1) {
      this.inodes.delete(ino);
      return true;
    } else {
      this.inodes.set(ino, {
        ...desc,
        nlink: desc.nlink - 1,
        ctime: Date.now()
      });
      return false;
    }
  }

  public updateMetadata(
    ino: number,
    updates: Partial<Pick<InodeDescriptor, 'size' | 'mode' | 'uid' | 'gid' | 'atime' | 'mtime'>>
  ): InodeDescriptor {
    const existing = this.inodes.get(ino);
    if (!existing) {
      throw new FileSystemError('ENOENT', `Inode ${ino} does not exist`);
    }

    const updated: InodeDescriptor = {
      ...existing,
      ...updates,
      ctime: Date.now()
    };

    this.inodes.set(ino, updated);
    return updated;
  }

  public getAllInodes(): readonly InodeDescriptor[] {
    return Array.from(this.inodes.values());
  }

  public getStats(): { totalInodes: number; allocatedPaths: number; symlinksCount: number } {
    return {
      totalInodes: this.inodes.size,
      allocatedPaths: this.pathToIno.size,
      symlinksCount: this.symlinks.size
    };
  }

  public clear(): void {
    this.inodes.clear();
    this.pathToIno.clear();
    this.symlinks.clear();
    this.nextIno = 1000;
  }
}
