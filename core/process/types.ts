/**
 * @file types.ts
 * @description Type definitions for the WebOS Process Management Subsystem.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { PermissionManager } from '../permissions/index.js';
import type { UserManager } from '../users/index.js';

/**
 * Standard WebOS process lifecycle states.
 */
export type ProcessState =
  | 'CREATED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'WAITING'
  | 'TERMINATED'
  | 'FAILED';

/**
 * Process scheduling priority level.
 */
export type ProcessPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

/**
 * Process descriptor representing an active or terminated process in WebOS.
 */
export interface Process {
  /** Unique numeric process identifier (e.g. 100, 101) */
  readonly pid: number;
  /** Internal unique UUID */
  readonly id: string;
  /** Process/Program name (e.g. 'Terminal', 'TextEditor', 'Init') */
  readonly name: string;
  /** Application package ID (e.g. 'app.webos.terminal') */
  readonly applicationId: string;
  /** Owner user ID */
  readonly userId: string;
  /** Parent process PID if spawned from another process */
  readonly parentPid?: number;
  /** Current lifecycle state */
  readonly state: ProcessState;
  /** Process priority */
  readonly priority: ProcessPriority;
  /** Timestamp when process was created */
  readonly createdAt: number;
  /** Timestamp when process entered RUNNING state */
  readonly startedAt?: number;
  /** Timestamp when process stopped/terminated */
  readonly stoppedAt?: number;
  /** Process exit code upon termination (0 = success, non-zero = error) */
  readonly exitCode?: number;
  /** Working directory in VFS */
  readonly cwd: string;
  /** Lightweight environment variables (e.g. USER, HOME, PATH) */
  readonly env: Readonly<Record<string, string>>;
  /** Custom application metadata */
  readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * Options when creating a new process.
 */
export interface CreateProcessOptions {
  /** Name of the process */
  readonly name: string;
  /** Application package ID (defaults to 'app.webos.<name>') */
  readonly applicationId?: string;
  /** Owner user ID (defaults to current active session user) */
  readonly userId?: string;
  /** Parent PID if spawned by another process */
  readonly parentPid?: number;
  /** Working directory (defaults to user's home directory or '/') */
  readonly cwd?: string;
  /** Process priority (defaults to 'NORMAL') */
  readonly priority?: ProcessPriority;
  /** Environment variables to merge */
  readonly env?: Record<string, string>;
  /** Custom metadata */
  readonly metadata?: Record<string, unknown>;
  /** If true, automatically transitions process to RUNNING state */
  readonly autoStart?: boolean;
}

/**
 * Options when terminating a process.
 */
export interface TerminateProcessOptions {
  /** Exit code (default 0) */
  readonly exitCode?: number;
  /** Reason for termination */
  readonly reason?: string;
  /** Whether to recursively terminate all child processes (defaults to true) */
  readonly terminateChildren?: boolean;
}

/**
 * Filter criteria for querying processes.
 */
export interface ProcessFilter {
  readonly userId?: string;
  readonly applicationId?: string;
  readonly state?: ProcessState;
  readonly parentPid?: number;
}

/**
 * Hierarchical tree node representation of a process and its children.
 */
export interface ProcessTreeNode {
  readonly process: Process;
  readonly children: readonly ProcessTreeNode[];
}

/**
 * Statistical summary of system processes.
 */
export interface ProcessStats {
  readonly totalProcesses: number;
  readonly runningProcesses: number;
  readonly pausedProcesses: number;
  readonly waitingProcesses: number;
  readonly terminatedProcesses: number;
  readonly processesByUser: Readonly<Record<string, number>>;
  readonly processesByApplication: Readonly<Record<string, number>>;
}

/**
 * Configuration options for ProcessManager.
 */
export interface ProcessManagerConfig {
  readonly eventBus?: EventBus;
  readonly userManager?: UserManager;
  readonly permissionManager?: PermissionManager;
  readonly fileSystem?: FileSystem;
  /** Initial PID start offset (defaults to 100) */
  readonly startPid?: number;
}
