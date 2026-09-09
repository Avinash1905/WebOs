/**
 * @file AppResourceQuota.ts
 * @description Per-application sandboxed resource governance: max open files, max sockets, memory cap.
 */

export interface AppQuotaLimits {
  readonly maxMemoryBytes: number;
  readonly maxOpenFiles: number;
  readonly maxIPCChannels: number;
}

export interface AppQuotaUsage {
  usedMemoryBytes: number;
  openFiles: Set<string>;
  ipcChannels: Set<string>;
}

export class AppResourceQuota {
  private readonly _limits = new Map<string, AppQuotaLimits>();
  private readonly _usage = new Map<string, AppQuotaUsage>();

  public setLimits(appId: string, limits: AppQuotaLimits): void {
    this._limits.set(appId, limits);
  }

  public canOpenFile(appId: string, filePath: string): boolean {
    const limits = this._limits.get(appId);
    if (!limits) return true;

    const usage = this.getOrCreateUsage(appId);
    if (usage.openFiles.has(filePath)) return true; // Already open

    return usage.openFiles.size < limits.maxOpenFiles;
  }

  public trackOpenFile(appId: string, filePath: string): boolean {
    if (!this.canOpenFile(appId, filePath)) return false;
    this.getOrCreateUsage(appId).openFiles.add(filePath);
    return true;
  }

  public trackCloseFile(appId: string, filePath: string): void {
    this.getOrCreateUsage(appId).openFiles.delete(filePath);
  }

  public trackMemory(appId: string, bytesDelta: number): boolean {
    const limits = this._limits.get(appId);
    const usage = this.getOrCreateUsage(appId);

    const projected = usage.usedMemoryBytes + bytesDelta;
    if (limits && projected > limits.maxMemoryBytes) {
      return false;
    }

    usage.usedMemoryBytes = Math.max(0, projected);
    return true;
  }

  private getOrCreateUsage(appId: string): AppQuotaUsage {
    let u = this._usage.get(appId);
    if (!u) {
      u = {
        usedMemoryBytes: 0,
        openFiles: new Set(),
        ipcChannels: new Set(),
      };
      this._usage.set(appId, u);
    }
    return u;
  }
}
