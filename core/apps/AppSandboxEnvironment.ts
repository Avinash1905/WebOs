/**
 * @file AppSandboxEnvironment.ts
 * @description Isolated runtime sandbox for applications.
 */

export interface SandboxConfig {
  readonly appId: string;
  readonly isolatedPath: string; // e.g. /app_data/app.webos.editor
  readonly allowedPermissions: readonly string[];
  readonly maxStorageBytes: number;
}

export class AppSandboxEnvironment {
  private readonly config: SandboxConfig;
  private currentStorageBytes = 0;

  constructor(config: SandboxConfig) {
    this.config = config;
  }

  public getAppId(): string {
    return this.config.appId;
  }

  public getIsolatedPath(): string {
    return this.config.isolatedPath;
  }

  public hasPermission(permission: string): boolean {
    return this.config.allowedPermissions.includes(permission) || this.config.allowedPermissions.includes('*');
  }

  public checkPathAccess(path: string): boolean {
    const base = this.config.isolatedPath;
    return path === base || path.startsWith(base === '/' ? '/' : `${base}/`) || path.startsWith('/tmp');
  }

  public allocateStorage(bytes: number): boolean {
    if (this.currentStorageBytes + bytes > this.config.maxStorageBytes) {
      return false;
    }
    this.currentStorageBytes += bytes;
    return true;
  }

  public freeStorage(bytes: number): void {
    this.currentStorageBytes = Math.max(0, this.currentStorageBytes - bytes);
  }

  public getStorageUsage(): { usedBytes: number; maxBytes: number; percentage: number } {
    return {
      usedBytes: this.currentStorageBytes,
      maxBytes: this.config.maxStorageBytes,
      percentage: this.config.maxStorageBytes > 0 ? (this.currentStorageBytes / this.config.maxStorageBytes) * 100 : 0
    };
  }
}
