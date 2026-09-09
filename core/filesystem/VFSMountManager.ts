/**
 * @file VFSMountManager.ts
 * @description Virtual File System Mount Point Manager for multi-volume support.
 */

import { FileSystemError } from './FileSystemError.js';

export type MountType = 'memory' | 'tempfs' | 'storage' | 'readonly';

export interface MountPoint {
  readonly mountId: string;
  readonly mountPath: string;
  readonly type: MountType;
  readonly name: string;
  readonly isReadOnly: boolean;
  readonly createdAt: number;
  readonly options?: Readonly<Record<string, unknown>>;
}

export class VFSMountManager {
  private readonly mounts = new Map<string, MountPoint>();

  constructor() {
    // Mount root filesystem by default
    this.mount('/', 'storage', { name: 'rootfs', isReadOnly: false });
    this.mount('/tmp', 'tempfs', { name: 'tmpfs', isReadOnly: false });
    this.mount('/sys', 'readonly', { name: 'sysfs', isReadOnly: true });
  }

  public mount(
    mountPath: string,
    type: MountType,
    options?: { name?: string; isReadOnly?: boolean; options?: Record<string, unknown> }
  ): MountPoint {
    const normalized = this.normalizeMountPath(mountPath);

    if (this.mounts.has(normalized) && normalized !== '/') {
      throw new FileSystemError('EEXIST', `Mount point ${normalized} already in use`);
    }

    const mountPoint: MountPoint = {
      mountId: `mnt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      mountPath: normalized,
      type,
      name: options?.name ?? (normalized.replace(/\//g, '_') || 'root'),
      isReadOnly: options?.isReadOnly ?? false,
      createdAt: Date.now(),
      options: options?.options ? Object.freeze({ ...options.options }) : undefined
    };

    this.mounts.set(normalized, mountPoint);
    return mountPoint;
  }

  public unmount(mountPath: string): boolean {
    const normalized = this.normalizeMountPath(mountPath);
    if (normalized === '/') {
      throw new FileSystemError('EBUSY', 'Cannot unmount root directory /');
    }
    return this.mounts.delete(normalized);
  }

  public resolveMount(path: string): { mount: MountPoint; relativePath: string } {
    const normalized = this.normalizeMountPath(path);
    let matchedMount: MountPoint | undefined;
    let longestPrefix = '';

    for (const [mPath, mount] of this.mounts.entries()) {
      if (normalized === mPath || normalized.startsWith(mPath === '/' ? '/' : `${mPath}/`)) {
        if (mPath.length > longestPrefix.length) {
          longestPrefix = mPath;
          matchedMount = mount;
        }
      }
    }

    if (!matchedMount) {
      matchedMount = this.mounts.get('/')!;
      longestPrefix = '/';
    }

    let rel = normalized.slice(longestPrefix.length);
    if (!rel.startsWith('/')) rel = `/${rel}`;

    return { mount: matchedMount, relativePath: rel };
  }

  public listMounts(): readonly MountPoint[] {
    return Array.from(this.mounts.values());
  }

  public isReadOnly(path: string): boolean {
    const { mount } = this.resolveMount(path);
    return mount.isReadOnly;
  }

  private normalizeMountPath(p: string): string {
    let clean = p.trim().replace(/\\/g, '/');
    if (!clean.startsWith('/')) clean = `/${clean}`;
    clean = clean.replace(/\/+/g, '/');
    if (clean.length > 1 && clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean || '/';
  }
}
