/**
 * WebOS Core - Virtual File System (VFS) Type Definitions
 * Complete POSIX-compliant virtual filesystem type structures.
 */

export type VFSNodeType = 'file' | 'directory' | 'symlink' | 'device' | 'fifo' | 'socket';

export type DeviceType = 'char' | 'block' | 'pipe';

export interface VFSPermissions {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  others: { read: boolean; write: boolean; execute: boolean };
  mode: number; // e.g. 0o755
}

export interface InodeMetadata {
  ino: number;
  type: VFSNodeType;
  size: number;
  blocks: number;
  nlink: number;
  uid: number;
  gid: number;
  mode: number;
  atime: number;
  mtime: number;
  ctime: number;
  birthtime: number;
  isReadOnly?: boolean;
  flags?: number;
}

export interface VFSFileStat {
  ino: number;
  name: string;
  path: string;
  type: VFSNodeType;
  size: number;
  blocks: number;
  nlink: number;
  uid: number;
  gid: number;
  mode: number;
  modeString: string;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
  isDirectory: () => boolean;
  isFile: () => boolean;
  isSymbolicLink: () => boolean;
  isDevice: () => boolean;
}

export interface VFSDirEntry {
  name: string;
  ino: number;
  type: VFSNodeType;
  size: number;
  mtime: number;
  path: string;
}

export enum VFSOpenFlags {
  O_RDONLY = 0,
  O_WRONLY = 1,
  O_RDWR = 2,
  O_CREAT = 64,
  O_EXCL = 128,
  O_NOCTTY = 256,
  O_TRUNC = 512,
  O_APPEND = 1024,
  O_NONBLOCK = 2048,
  O_SYNC = 4096,
  O_DIRECTORY = 65536,
  O_NOFOLLOW = 131072,
}

export enum VFSSeekOrigin {
  SEEK_SET = 0,
  SEEK_CUR = 1,
  SEEK_END = 2,
}

export interface FileDescriptor {
  fd: number;
  ino: number;
  path: string;
  flags: number;
  offset: number;
  openedAt: number;
  processId: number;
  readable: boolean;
  writable: boolean;
}

export interface MountPoint {
  mountPath: string;
  deviceSource: string;
  fstype: string;
  readOnly: boolean;
  mountedAt: number;
}

export interface VFSEvent {
  type: 'create' | 'modify' | 'delete' | 'rename' | 'mount' | 'unmount' | 'chmod' | 'chown';
  path: string;
  ino: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface VFSStreamReader {
  read(size?: number): Promise<Uint8Array | null>;
  readText(encoding?: string): Promise<string | null>;
  close(): Promise<void>;
  isEOF(): boolean;
}

export interface VFSStreamWriter {
  write(chunk: Uint8Array | string): Promise<number>;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export interface StoragePersistenceAdapter {
  name: string;
  save(key: string, data: Uint8Array): Promise<boolean>;
  load(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<boolean>;
  listKeys(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}
