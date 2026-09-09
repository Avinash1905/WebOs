/**
 * WebOS Core - POSIX Permission System
 * Handles octal bitmask calculations, permission verification, and mode string representations.
 */

import { VFSPermissions, InodeMetadata } from './types';

export class Permissions {
  public static readonly S_ISUID = 0o4000;
  public static readonly S_ISGID = 0o2000;
  public static readonly S_ISVTX = 0o1000;

  public static readonly S_IRWXU = 0o0700;
  public static readonly S_IRUSR = 0o0400;
  public static readonly S_IWUSR = 0o0200;
  public static readonly S_IXUSR = 0o0100;

  public static readonly S_IRWXG = 0o0070;
  public static readonly S_IRGRP = 0o0040;
  public static readonly S_IWGRP = 0o0020;
  public static readonly S_IXGRP = 0o0010;

  public static readonly S_IRWXO = 0o0007;
  public static readonly S_IROTH = 0o0004;
  public static readonly S_IWOTH = 0o0002;
  public static readonly S_IXOTH = 0o0001;

  public static readonly DEFAULT_DIR_MODE = 0o755;
  public static readonly DEFAULT_FILE_MODE = 0o644;
  public static readonly DEFAULT_EXEC_MODE = 0o755;

  /**
   * Converts an octal mode integer into a structured VFSPermissions object.
   */
  public static parseMode(mode: number): VFSPermissions {
    return {
      owner: {
        read: (mode & Permissions.S_IRUSR) !== 0,
        write: (mode & Permissions.S_IWUSR) !== 0,
        execute: (mode & Permissions.S_IXUSR) !== 0,
      },
      group: {
        read: (mode & Permissions.S_IRGRP) !== 0,
        write: (mode & Permissions.S_IWGRP) !== 0,
        execute: (mode & Permissions.S_IXGRP) !== 0,
      },
      others: {
        read: (mode & Permissions.S_IROTH) !== 0,
        write: (mode & Permissions.S_IWOTH) !== 0,
        execute: (mode & Permissions.S_IXOTH) !== 0,
      },
      mode: mode & 0o7777,
    };
  }

  /**
   * Builds an octal mode number from symbolic permissions.
   */
  public static buildMode(perms: Omit<VFSPermissions, 'mode'>): number {
    let mode = 0;
    if (perms.owner.read) mode |= Permissions.S_IRUSR;
    if (perms.owner.write) mode |= Permissions.S_IWUSR;
    if (perms.owner.execute) mode |= Permissions.S_IXUSR;

    if (perms.group.read) mode |= Permissions.S_IRGRP;
    if (perms.group.write) mode |= Permissions.S_IWGRP;
    if (perms.group.execute) mode |= Permissions.S_IXGRP;

    if (perms.others.read) mode |= Permissions.S_IROTH;
    if (perms.others.write) mode |= Permissions.S_IWOTH;
    if (perms.others.execute) mode |= Permissions.S_IXOTH;

    return mode;
  }

  /**
   * Converts a mode number and node type into a standard unix mode string like "-rwxr-xr-x" or "drwxr-xr-x".
   */
  public static toModeString(mode: number, type: string = 'file'): string {
    let typeChar = '-';
    switch (type) {
      case 'directory':
        typeChar = 'd';
        break;
      case 'symlink':
        typeChar = 'l';
        break;
      case 'device':
        typeChar = 'c';
        break;
      case 'fifo':
        typeChar = 'p';
        break;
      case 'socket':
        typeChar = 's';
        break;
    }

    const r1 = (mode & Permissions.S_IRUSR) ? 'r' : '-';
    const w1 = (mode & Permissions.S_IWUSR) ? 'w' : '-';
    let x1 = (mode & Permissions.S_IXUSR) ? 'x' : '-';
    if (mode & Permissions.S_ISUID) x1 = x1 === 'x' ? 's' : 'S';

    const r2 = (mode & Permissions.S_IRGRP) ? 'r' : '-';
    const w2 = (mode & Permissions.S_IWGRP) ? 'w' : '-';
    let x2 = (mode & Permissions.S_IXGRP) ? 'x' : '-';
    if (mode & Permissions.S_ISGID) x2 = x2 === 'x' ? 's' : 'S';

    const r3 = (mode & Permissions.S_IROTH) ? 'r' : '-';
    const w3 = (mode & Permissions.S_IWOTH) ? 'w' : '-';
    let x3 = (mode & Permissions.S_IXOTH) ? 'x' : '-';
    if (mode & Permissions.S_ISVTX) x3 = x3 === 'x' ? 't' : 'T';

    return `${typeChar}${r1}${w1}${x1}${r2}${w2}${x2}${r3}${w3}${x3}`;
  }

  /**
   * Evaluates if a process/user with given uid and gid can perform read, write, or execute operations.
   */
  public static canAccess(
    metadata: InodeMetadata,
    uid: number,
    gid: number,
    required: { read?: boolean; write?: boolean; execute?: boolean }
  ): boolean {
    // Root user (uid 0) bypasses read/write checks; execute still requires at least one exec bit set
    if (uid === 0) {
      if (required.execute) {
        return (metadata.mode & (Permissions.S_IXUSR | Permissions.S_IXGRP | Permissions.S_IXOTH)) !== 0;
      }
      return true;
    }

    const isOwner = metadata.uid === uid;
    const isGroup = metadata.gid === gid;

    if (isOwner) {
      if (required.read && !(metadata.mode & Permissions.S_IRUSR)) return false;
      if (required.write && !(metadata.mode & Permissions.S_IWUSR)) return false;
      if (required.execute && !(metadata.mode & Permissions.S_IXUSR)) return false;
      return true;
    }

    if (isGroup) {
      if (required.read && !(metadata.mode & Permissions.S_IRGRP)) return false;
      if (required.write && !(metadata.mode & Permissions.S_IWGRP)) return false;
      if (required.execute && !(metadata.mode & Permissions.S_IXGRP)) return false;
      return true;
    }

    // Others
    if (required.read && !(metadata.mode & Permissions.S_IROTH)) return false;
    if (required.write && !(metadata.mode & Permissions.S_IWOTH)) return false;
    if (required.execute && !(metadata.mode & Permissions.S_IXOTH)) return false;
    return true;
  }
}
