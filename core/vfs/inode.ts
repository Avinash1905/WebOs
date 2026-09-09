/**
 * WebOS Core - Inode Management System
 * Manages the Inode table, disk/memory block allocation, metadata, and link reference counting.
 */

import { InodeMetadata, VFSNodeType } from './types';
import { VFSBuffer } from './buffer';
import { Permissions } from './permissions';

export class Inode {
  public metadata: InodeMetadata;
  public data: VFSBuffer;
  public symlinkTarget?: string;
  public deviceMajor?: number;
  public deviceMinor?: number;

  constructor(
    ino: number,
    type: VFSNodeType,
    mode?: number,
    uid: number = 0,
    gid: number = 0
  ) {
    const now = Date.now();
    const defaultMode =
      type === 'directory'
        ? Permissions.DEFAULT_DIR_MODE
        : Permissions.DEFAULT_FILE_MODE;

    this.metadata = {
      ino,
      type,
      size: 0,
      blocks: 0,
      nlink: type === 'directory' ? 2 : 1,
      uid,
      gid,
      mode: mode ?? defaultMode,
      atime: now,
      mtime: now,
      ctime: now,
      birthtime: now,
    };
    this.data = new VFSBuffer();
  }

  public updateSize() {
    this.metadata.size = this.data.size;
    this.metadata.blocks = Math.ceil(this.metadata.size / 512);
  }

  public touchAccess() {
    this.metadata.atime = Date.now();
  }

  public touchModify() {
    const now = Date.now();
    this.metadata.mtime = now;
    this.metadata.ctime = now;
    this.updateSize();
  }

  public touchStatus() {
    this.metadata.ctime = Date.now();
  }
}

export class InodeTable {
  private inodes: Map<number, Inode> = new Map();
  private nextIno: number = 1;

  constructor() {
    // Reserve root inode (ino 1)
  }

  public allocate(
    type: VFSNodeType,
    mode?: number,
    uid: number = 0,
    gid: number = 0
  ): Inode {
    const ino = this.nextIno++;
    const inode = new Inode(ino, type, mode, uid, gid);
    this.inodes.set(ino, inode);
    return inode;
  }

  public get(ino: number): Inode | undefined {
    return this.inodes.get(ino);
  }

  public has(ino: number): boolean {
    return this.inodes.has(ino);
  }

  public incrementLink(ino: number): number {
    const inode = this.inodes.get(ino);
    if (!inode) return 0;
    inode.metadata.nlink++;
    inode.touchStatus();
    return inode.metadata.nlink;
  }

  public decrementLink(ino: number): number {
    const inode = this.inodes.get(ino);
    if (!inode) return 0;
    inode.metadata.nlink = Math.max(0, inode.metadata.nlink - 1);
    inode.touchStatus();

    if (inode.metadata.nlink === 0) {
      this.free(ino);
      return 0;
    }
    return inode.metadata.nlink;
  }

  public free(ino: number): boolean {
    return this.inodes.delete(ino);
  }

  public getAllInodes(): Inode[] {
    return Array.from(this.inodes.values());
  }

  public getCount(): number {
    return this.inodes.size;
  }

  public clear() {
    this.inodes.clear();
    this.nextIno = 1;
  }
}
