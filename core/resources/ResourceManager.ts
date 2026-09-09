/**
 * @file ResourceManager.ts
 * @description Central Resource Manager System Service for WebOS.
 */

import { BaseSystemService } from '../kernel/index.js';
import { MemoryMonitor } from './MemoryMonitor.js';
import { StorageMonitor } from './StorageMonitor.js';
import { ProcessMonitor } from './ProcessMonitor.js';
import { ResourceMonitor } from './ResourceMonitor.js';
import { resolveResourceLimits } from './ResourceLimits.js';
import { RESOURCE_EVENTS } from './ResourceEvents.js';
import type {
  ApplicationResourceInfo,
  MemoryUsageInfo,
  ResourceLimits,
  ResourceMetrics,
  ResourceManagerDependencies,
  ResourceMonitorConfig,
  ResourceSnapshot,
  StorageResourceInfo,
  VFSResourceInfo,
} from './types.js';

export class ResourceManager extends BaseSystemService {
  public override readonly name = 'resource-manager';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'storage',
    'process-manager',
    'apps',
    'filesystem',
    'services',
  ];

  private readonly _deps: ResourceManagerDependencies;
  private _limits: Required<ResourceLimits>;
  private readonly _monitor: ResourceMonitor;
  private _snapshotsCount = 0;
  private _warningsCount = 0;
  private _criticalCount = 0;
  private _startedMonitoringAt: number | null = null;
  private _lastSnapshotTime?: number;

  constructor(
    deps: ResourceManagerDependencies = {},
    config?: ResourceMonitorConfig
  ) {
    super();
    this._deps = deps;
    this._limits = resolveResourceLimits(config?.limits);
    this._monitor = new ResourceMonitor(
      () => this.getResourceSnapshot(),
      deps.eventBus,
      config?.intervalMs ?? 5000
    );
  }

  public async createSnapshot(): Promise<ResourceSnapshot> {
    return this.getResourceSnapshot();
  }

  public async getResourceSnapshot(): Promise<ResourceSnapshot> {
    const memory = this.getMemoryUsage();
    const storage = await this.getStorageUsage();
    const processes = this.getProcessMetrics();
    const applications = this.getApplicationMetrics();
    const vfs = await this.getVFSMetrics();

    let serviceStats = { total: 0, running: 0, failed: 0 };
    if (this._deps.serviceManager) {
      const all = this._deps.serviceManager.getServices();
      serviceStats = {
        total: all.length,
        running: this._deps.serviceManager.getRunningServices().length,
        failed: this._deps.serviceManager.getFailedServices().length,
      };
    }

    let overallHealth: ResourceSnapshot['overallHealth'] = 'HEALTHY';
    if (memory.status === 'CRITICAL' || storage.status === 'CRITICAL') {
      overallHealth = 'CRITICAL';
      this._criticalCount++;
    } else if (memory.status === 'WARNING' || storage.status === 'WARNING') {
      overallHealth = 'WARNING';
      this._warningsCount++;
    }

    this._snapshotsCount++;
    this._lastSnapshotTime = Date.now();

    const snapshot: ResourceSnapshot = {
      timestamp: this._lastSnapshotTime,
      memory,
      storage,
      processes,
      applications,
      vfs,
      services: serviceStats,
      overallHealth,
    };

    return snapshot;
  }

  public getMemoryUsage(): MemoryUsageInfo {
    return MemoryMonitor.getMemoryUsage();
  }

  public async getStorageUsage(): Promise<StorageResourceInfo> {
    return StorageMonitor.getStorageUsage(
      this._deps.storage,
      this._limits.storageWarningThresholdPercent,
      this._limits.storageCriticalThresholdPercent
    );
  }

  public getProcessMetrics(): ReturnType<typeof ProcessMonitor.getProcessMetrics> {
    return ProcessMonitor.getProcessMetrics(this._deps.processManager);
  }

  public getApplicationMetrics(): ApplicationResourceInfo {
    if (!this._deps.appRuntime) {
      return {
        registeredApps: 0,
        runningApps: 0,
        totalInstances: 0,
        instancesByApp: {},
        instancesByUser: {},
      };
    }

    const reg = this._deps.appRuntime.getRegistry();
    const mgr = this._deps.appRuntime.getManager();
    const allInstances = mgr.getAllInstances();

    const instancesByApp: Record<string, number> = {};
    const instancesByUser: Record<string, number> = {};

    for (const inst of allInstances) {
      instancesByApp[inst.appId] = (instancesByApp[inst.appId] ?? 0) + 1;
      instancesByUser[inst.userId] = (instancesByUser[inst.userId] ?? 0) + 1;
    }

    return {
      registeredApps: reg.count(),
      runningApps: Object.keys(instancesByApp).length,
      totalInstances: allInstances.length,
      instancesByApp,
      instancesByUser,
    };
  }

  public async getVFSMetrics(): Promise<VFSResourceInfo> {
    if (!this._deps.filesystem) {
      return { totalNodes: 0, fileCount: 0, directoryCount: 0 };
    }

    try {
      const items = await this._deps.filesystem.listDirectory('/', {
        recursive: true,
        includeHidden: true,
      });

      let fileCount = 0;
      let directoryCount = 1; // root directory

      for (const item of items) {
        if (item.type === 'file') fileCount++;
        else if (item.type === 'directory') directoryCount++;
      }

      return {
        totalNodes: fileCount + directoryCount,
        fileCount,
        directoryCount,
      };
    } catch {
      return { totalNodes: 0, fileCount: 0, directoryCount: 0 };
    }
  }

  public getLimits(): Required<ResourceLimits> {
    return { ...this._limits };
  }

  public updateLimits(limits: Partial<ResourceLimits>): void {
    this.setLimits(limits);
  }

  public setLimits(limits: Partial<ResourceLimits>): void {
    this._limits = resolveResourceLimits({ ...this._limits, ...limits });
  }

  public async checkLimits(): Promise<{ exceeded: boolean; violations: string[] }> {
    const violations: string[] = [];
    const procMetrics = this.getProcessMetrics();
    if (procMetrics.totalProcesses > this._limits.maxProcesses) {
      violations.push(`Process count (${procMetrics.totalProcesses}) exceeds limit of ${this._limits.maxProcesses}`);
    }

    const appMetrics = this.getApplicationMetrics();
    if (appMetrics.totalInstances > this._limits.maxAppInstances) {
      violations.push(`Application instance count (${appMetrics.totalInstances}) exceeds limit of ${this._limits.maxAppInstances}`);
    }

    const storageUsage = await this.getStorageUsage();
    if (storageUsage.percentUsed !== undefined && storageUsage.percentUsed >= this._limits.storageCriticalThresholdPercent) {
      violations.push(`Storage usage (${storageUsage.percentUsed}%) exceeds critical limit of ${this._limits.storageCriticalThresholdPercent}%`);
    }

    if (violations.length > 0 && this._deps.eventBus) {
      this._deps.eventBus.emit(RESOURCE_EVENTS.LIMIT_REACHED as any, {
        violations,
        timestamp: Date.now(),
      } as any);
    }

    return {
      exceeded: violations.length > 0,
      violations,
    };
  }

  public startMonitoring(intervalMs?: number): void {
    this._startedMonitoringAt = Date.now();
    this._monitor.start(intervalMs);
  }

  public stopMonitoring(): void {
    this._monitor.stop();
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring();
  }

  public isMonitoring(): boolean {
    return this._monitor.isRunning();
  }

  public getMetrics(): ResourceMetrics {
    const monitoringUptimeMs = this._startedMonitoringAt
      ? Math.max(0, Date.now() - this._startedMonitoringAt)
      : 0;

    return {
      snapshotsCollected: this._snapshotsCount,
      warningsCount: this._warningsCount,
      criticalCount: this._criticalCount,
      monitoringUptimeMs,
      lastSnapshotTime: this._lastSnapshotTime,
    };
  }

  protected override async onStart(): Promise<void> {
    // Resource Manager active
  }

  protected override async onStop(): Promise<void> {
    this.stopMonitoring();
  }
}
