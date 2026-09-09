/**
 * @file types.ts
 * @description Type definitions for the WebOS Resource Manager Subsystem.
 */

import type { EventBus } from '../events/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { ProcessManager } from '../process/index.js';
import type { ApplicationRuntime } from '../apps/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { ServiceManager } from '../services/index.js';

export type ResourceHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface MemoryUsageInfo {
  readonly usedBytes?: number;
  readonly totalBytes?: number;
  readonly limitBytes?: number;
  readonly percentUsed?: number;
  readonly available: boolean;
  readonly status: ResourceHealthStatus;
}

export interface StorageResourceInfo {
  readonly usedBytes: number;
  readonly quotaBytes?: number;
  readonly percentUsed?: number;
  readonly totalKeys?: number;
  readonly namespaceCount?: number;
  readonly namespaces?: Record<string, number>;
  readonly status: ResourceHealthStatus;
}

export interface ProcessResourceInfo {
  readonly totalProcesses: number;
  readonly runningProcesses: number;
  readonly pausedProcesses: number;
  readonly terminatedProcesses: number;
  readonly failedProcesses: number;
  readonly byUser: Record<string, number>;
  readonly byApp: Record<string, number>;
}

export interface ApplicationResourceInfo {
  readonly registeredApps: number;
  readonly runningApps: number;
  readonly totalInstances: number;
  readonly instancesByApp: Record<string, number>;
  readonly instancesByUser: Record<string, number>;
}

export interface VFSResourceInfo {
  readonly totalNodes: number;
  readonly fileCount: number;
  readonly directoryCount: number;
}

export interface ResourceLimits {
  readonly maxProcesses?: number;
  readonly maxAppInstances?: number;
  readonly maxClipboardHistory?: number;
  readonly maxSearchResults?: number;
  readonly storageWarningThresholdPercent?: number;
  readonly storageCriticalThresholdPercent?: number;
}

export interface ResourceSnapshot {
  readonly timestamp: number;
  readonly memory: MemoryUsageInfo;
  readonly storage: StorageResourceInfo;
  readonly processes: ProcessResourceInfo;
  readonly applications: ApplicationResourceInfo;
  readonly vfs: VFSResourceInfo;
  readonly services: {
    readonly total: number;
    readonly running: number;
    readonly failed: number;
  };
  readonly overallHealth: ResourceHealthStatus;
}

export interface ResourceMetrics {
  readonly snapshotsCollected: number;
  readonly warningsCount: number;
  readonly criticalCount: number;
  readonly monitoringUptimeMs: number;
  readonly lastSnapshotTime?: number;
}

export interface ResourceMonitorConfig {
  readonly intervalMs?: number;
  readonly enabled?: boolean;
  readonly limits?: ResourceLimits;
}

export interface ResourceManagerDependencies {
  readonly eventBus?: EventBus;
  readonly storage?: StorageEngine;
  readonly processManager?: ProcessManager;
  readonly appRuntime?: ApplicationRuntime;
  readonly filesystem?: FileSystem;
  readonly serviceManager?: ServiceManager;
}
