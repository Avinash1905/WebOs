/**
 * @file FUSEDriverBridge.ts
 * @description Filesystem in Userspace (FUSE) kernel-user space bridge interface.
 */

export interface FUSEOperations {
  getattr?(path: string): Promise<{ size: number; isDirectory: boolean } | null>;
  readdir?(path: string): Promise<string[]>;
  read?(path: string, offset: number, size: number): Promise<string>;
  write?(path: string, content: string, offset: number): Promise<number>;
}

export class FUSEDriverBridge {
  private _ops: FUSEOperations | null = null;
  private _mountPoint: string = '';

  public mount(mountPoint: string, ops: FUSEOperations): void {
    this._mountPoint = mountPoint;
    this._ops = ops;
  }

  public async handleGetAttr(path: string): Promise<{ size: number; isDirectory: boolean } | null> {
    if (!this._ops || !this._ops.getattr) return null;
    return this._ops.getattr(path);
  }

  public async handleReaddir(path: string): Promise<string[]> {
    if (!this._ops || !this._ops.readdir) return [];
    return this._ops.readdir(path);
  }

  public get mountPoint(): string {
    return this._mountPoint;
  }
}
