/**
 * @file KernelWatchdog.ts
 * @description Background liveness monitor and hang detector for registered Kernel services.
 */

import type { SystemService } from './Service.js';

export interface WatchdogConfig {
  readonly checkIntervalMs?: number;
  readonly defaultTimeoutMs?: number;
  readonly maxMissedHeartbeats?: number;
  readonly autoRecover?: boolean;
}

export interface WatchdogStatus {
  readonly active: boolean;
  readonly monitoredServicesCount: number;
  readonly hungServices: string[];
  readonly lastCheckTimestamp?: number;
}

export class KernelWatchdog {
  private readonly _heartbeats = new Map<string, { lastSeen: number; missedCount: number }>();
  private readonly _services = new Map<string, SystemService>();
  private _intervalHandle?: ReturnType<typeof setInterval>;
  private readonly _config: Required<WatchdogConfig>;
  private _lastCheckTimestamp?: number;
  private _onHangDetected?: (serviceName: string, service: SystemService) => void | Promise<void>;

  constructor(config?: WatchdogConfig) {
    this._config = {
      checkIntervalMs: config?.checkIntervalMs ?? 5000,
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 10000,
      maxMissedHeartbeats: config?.maxMissedHeartbeats ?? 3,
      autoRecover: config?.autoRecover ?? true,
    };
  }

  public registerService(service: SystemService): void {
    this._services.set(service.name, service);
    this._heartbeats.set(service.name, {
      lastSeen: Date.now(),
      missedCount: 0,
    });
  }

  public unregisterService(serviceName: string): void {
    this._services.delete(serviceName);
    this._heartbeats.delete(serviceName);
  }

  public recordHeartbeat(serviceName: string): void {
    const entry = this._heartbeats.get(serviceName);
    if (entry) {
      entry.lastSeen = Date.now();
      entry.missedCount = 0;
    }
  }

  public onHang(callback: (serviceName: string, service: SystemService) => void | Promise<void>): void {
    this._onHangDetected = callback;
  }

  public start(): void {
    if (this._intervalHandle) return;
    this._intervalHandle = setInterval(() => {
      void this.performHealthCheck();
    }, this._config.checkIntervalMs);
  }

  public stop(): void {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = undefined;
    }
  }

  public async performHealthCheck(): Promise<string[]> {
    this._lastCheckTimestamp = Date.now();
    const now = this._lastCheckTimestamp;
    const hung: string[] = [];

    for (const [name, service] of this._services.entries()) {
      if (service.getStatus() !== 'RUNNING') continue;

      const entry = this._heartbeats.get(name);
      if (!entry) continue;

      const elapsed = now - entry.lastSeen;
      if (elapsed > this._config.defaultTimeoutMs) {
        entry.missedCount++;
        if (entry.missedCount >= this._config.maxMissedHeartbeats) {
          hung.push(name);
          if (this._onHangDetected) {
            await this._onHangDetected(name, service);
          }
        }
      }
    }

    return hung;
  }

  public getStatus(): WatchdogStatus {
    const hung: string[] = [];
    const now = Date.now();

    for (const [name, entry] of this._heartbeats.entries()) {
      if (now - entry.lastSeen > this._config.defaultTimeoutMs && entry.missedCount >= this._config.maxMissedHeartbeats) {
        hung.push(name);
      }
    }

    return {
      active: this._intervalHandle !== undefined,
      monitoredServicesCount: this._services.size,
      hungServices: hung,
      lastCheckTimestamp: this._lastCheckTimestamp,
    };
  }
}
