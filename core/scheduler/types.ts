/**
 * @file types.ts
 * @description Types and interfaces for the WebOS Process Scheduler subsystem.
 */

import type { EventBus } from '../events/index.js';
import type { ProcessManager, ProcessPriority } from '../process/index.js';
import type { StorageEngine } from '../storage/index.js';

export type SchedulerStatus =
  | 'CREATED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR';

export interface SchedulerState {
  readonly status: SchedulerStatus;
  readonly startedAt?: number;
  readonly stoppedAt?: number;
  readonly pausedAt?: number;
  readonly failedAt?: number;
  readonly error?: Error | string;
}

export type SchedulingState =
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'TERMINATED'
  | 'FAILED';

export interface ProcessSchedulingInfo {
  readonly pid: number;
  priority: ProcessPriority;
  timeSliceMs: number;
  remainingSliceMs: number;
  totalCpuTimeMs: number;
  enqueuedAt: number;
  lastRunAt?: number;
  state: SchedulingState;
}

export interface SchedulerConfig {
  /** Default time slice in milliseconds for NORMAL priority (default: 50ms) */
  readonly defaultTimeSliceMs?: number;
  /** Minimum allowable time slice (default: 10ms) */
  readonly minTimeSliceMs?: number;
  /** Maximum allowable time slice (default: 500ms) */
  readonly maxTimeSliceMs?: number;
  /** Whether to automatically run the timer loop on start (default: false) */
  readonly autoStep?: boolean;
  /** Step timer interval in milliseconds when autoStep is enabled (default: 50ms) */
  readonly stepIntervalMs?: number;
  /** Whether anti-starvation aging is enabled (default: true) */
  readonly enableAging?: boolean;
  /** Aging threshold in milliseconds to bump starved processes (default: 5000ms) */
  readonly agingThresholdMs?: number;
  /** Optional ProcessManager instance */
  readonly processManager?: ProcessManager;
  /** Optional EventBus instance */
  readonly eventBus?: EventBus;
  /** Optional StorageEngine instance */
  readonly storage?: StorageEngine;
}

export interface ResolvedSchedulerConfig {
  readonly defaultTimeSliceMs: number;
  readonly minTimeSliceMs: number;
  readonly maxTimeSliceMs: number;
  readonly autoStep: boolean;
  readonly stepIntervalMs: number;
  readonly enableAging: boolean;
  readonly agingThresholdMs: number;
}

export interface SchedulerMetrics {
  readonly totalScheduled: number;
  readonly currentlyRunningPid: number | null;
  readonly readyQueueSize: number;
  readonly completedProcesses: number;
  readonly terminatedProcesses: number;
  readonly failedProcesses: number;
  readonly contextSwitches: number;
  readonly uptimeMs: number;
  readonly totalExecutionTimeMs: number;
  readonly avgExecutionTimeMs: number;
}
