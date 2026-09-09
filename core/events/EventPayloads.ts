/**
 * @file EventPayloads.ts
 * @description Strongly-typed payload interfaces for WebOS system events.
 */

// ==========================================
// 1. System & Kernel Lifecycle Payloads
// ==========================================
export interface SystemLifecyclePayload {
  readonly status?: string;
  readonly timestamp?: number;
}

export interface SystemErrorPayload {
  readonly error: Error | string;
  readonly source?: string;
  readonly details?: unknown;
}

// ==========================================
// 2. File System Payloads
// ==========================================
export interface FileCreatedPayload {
  readonly path: string;
  readonly size?: number;
  readonly mimeType?: string;
}

export interface FileUpdatedPayload {
  readonly path: string;
  readonly size?: number;
  readonly mimeType?: string;
  readonly modifiedAt?: number;
}

export interface FileDeletedPayload {
  readonly path: string;
}

export interface FileRenamedPayload {
  readonly oldPath: string;
  readonly newPath: string;
}

export interface FileMovedPayload {
  readonly sourcePath: string;
  readonly destinationPath: string;
}

export interface FileCopiedPayload {
  readonly sourcePath: string;
  readonly destinationPath: string;
}

export interface DirectoryCreatedPayload {
  readonly path: string;
}

export interface DirectoryDeletedPayload {
  readonly path: string;
  readonly recursive?: boolean;
}

export interface DirectoryRenamedPayload {
  readonly oldPath: string;
  readonly newPath: string;
}

export interface DirectoryMovedPayload {
  readonly sourcePath: string;
  readonly destinationPath: string;
}

// ==========================================
// 3. Process Payloads
// ==========================================
export interface ProcessCreatedPayload {
  readonly pid: number | string;
  readonly name: string;
  readonly parentPid?: number | string;
  readonly command?: string;
}

export interface ProcessStartedPayload {
  readonly pid: number | string;
  readonly name: string;
  readonly startedAt?: number;
}

export interface ProcessPausedPayload {
  readonly pid: number | string;
  readonly name: string;
}

export interface ProcessResumedPayload {
  readonly pid: number | string;
  readonly name: string;
}

export interface ProcessStoppedPayload {
  readonly pid: number | string;
  readonly name: string;
  readonly exitCode?: number;
}

export interface ProcessTerminatedPayload {
  readonly pid: number | string;
  readonly name: string;
  readonly reason?: string;
}

export interface ProcessRestartedPayload {
  readonly pid: number | string;
  readonly name: string;
}

export interface ProcessErrorPayload {
  readonly pid: number | string;
  readonly name?: string;
  readonly error: Error | string;
}

// ==========================================
// 4. Application Payloads
// ==========================================
export interface AppRegisteredPayload {
  readonly appId: string;
  readonly name: string;
  readonly version?: string;
}

export interface AppOpenedPayload {
  readonly appId: string;
  readonly instanceId: string;
  readonly windowId?: string;
}

export interface AppClosedPayload {
  readonly appId: string;
  readonly instanceId: string;
  readonly exitCode?: number;
}

export interface AppErrorPayload {
  readonly appId: string;
  readonly instanceId?: string;
  readonly error: Error | string;
}

// ==========================================
// 5. User & Session Payloads
// ==========================================
export interface UserCreatedPayload {
  readonly userId: string;
  readonly username: string;
  readonly role?: string;
  readonly createdAt?: number;
}

export interface UserUpdatedPayload {
  readonly userId: string;
  readonly username?: string;
  readonly changes?: readonly string[];
}

export interface UserDeletedPayload {
  readonly userId: string;
  readonly username?: string;
}

export interface UserLoginPayload {
  readonly userId: string;
  readonly username: string;
  readonly loginAt?: number;
}

export interface UserLogoutPayload {
  readonly userId: string;
  readonly username?: string;
  readonly logoutAt?: number;
}

export interface SessionStartedPayload {
  readonly sessionId: string;
  readonly userId: string;
  readonly startedAt?: number;
}

export interface SessionEndedPayload {
  readonly sessionId: string;
  readonly userId: string;
  readonly durationMs?: number;
}

// ==========================================
// 6. Storage Payloads
// ==========================================
export interface StorageReadyPayload {
  readonly driver: string;
  readonly totalBytes?: number;
  readonly availableBytes?: number;
}

export interface StorageChangedPayload {
  readonly key?: string;
  readonly path?: string;
  readonly action: 'set' | 'remove' | 'clear';
}

export interface StorageQuotaWarningPayload {
  readonly usedBytes: number;
  readonly maxBytes: number;
  readonly percentUsed: number;
}

export interface StorageErrorPayload {
  readonly driver?: string;
  readonly operation: string;
  readonly error: Error | string;
}

// ==========================================
// 7. Security & Permission Payloads
// ==========================================
export interface PermissionGrantedPayload {
  readonly permission: string;
  readonly targetId: string;
  readonly grantedTo: string;
}

export interface PermissionDeniedPayload {
  readonly permission: string;
  readonly targetId: string;
  readonly requestedBy: string;
  readonly reason?: string;
}

export interface PermissionRevokedPayload {
  readonly permission: string;
  readonly targetId: string;
  readonly revokedFrom: string;
}

export interface SecurityViolationPayload {
  readonly type: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly source?: string;
}

// ==========================================
// 8. Scheduler Payloads
// ==========================================
export interface SchedulerLifecyclePayload {
  readonly status?: string;
  readonly timestamp?: number;
}

export interface SchedulerErrorPayload {
  readonly error: Error | string;
  readonly context?: unknown;
}

export interface ProcessScheduledPayload {
  readonly pid: number;
  readonly priority: string;
  readonly timeSliceMs: number;
}

export interface ProcessPreemptedPayload {
  readonly pid: number;
  readonly reason?: string;
}

export interface ProcessCompletedPayload {
  readonly pid: number;
  readonly exitCode?: number;
}

export interface ProcessPriorityChangedPayload {
  readonly pid: number;
  readonly oldPriority: string;
  readonly newPriority: string;
}

// ==========================================
// 9. Shell Payloads
// ==========================================
export interface ShellLifecyclePayload {
  readonly status?: string;
  readonly timestamp?: number;
}

export interface ShellSessionPayload {
  readonly sessionId: string;
  readonly userId: string;
  readonly username?: string;
  readonly cwd: string;
}

export interface CommandStartedPayload {
  readonly sessionId: string;
  readonly command: string;
  readonly args: readonly string[];
}

export interface CommandCompletedPayload {
  readonly sessionId: string;
  readonly command: string;
  readonly exitCode: number;
  readonly durationMs?: number;
}

export interface CommandFailedPayload {
  readonly sessionId: string;
  readonly command: string;
  readonly error: string;
  readonly exitCode: number;
}

