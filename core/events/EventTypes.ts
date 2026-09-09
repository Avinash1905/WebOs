/**
 * @file EventTypes.ts
 * @description Standard system event type constants and union types for WebOS.
 */

// ==========================================
// 1. System & Kernel Lifecycle Events
// ==========================================
export const SYSTEM_EVENTS = {
  SYSTEM_INITIALIZING: 'SYSTEM_INITIALIZING',
  SYSTEM_INITIALIZED: 'SYSTEM_INITIALIZED',
  SYSTEM_STARTING: 'SYSTEM_STARTING',
  SYSTEM_STARTED: 'SYSTEM_STARTED',
  SYSTEM_STOPPING: 'SYSTEM_STOPPING',
  SYSTEM_STOPPED: 'SYSTEM_STOPPED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

export type SystemLifecycleEventType =
  (typeof SYSTEM_EVENTS)[keyof typeof SYSTEM_EVENTS];

// ==========================================
// 2. File System Events
// ==========================================
export const FILE_SYSTEM_EVENTS = {
  FILE_CREATED: 'FILE_CREATED',
  FILE_UPDATED: 'FILE_UPDATED',
  FILE_DELETED: 'FILE_DELETED',
  FILE_RENAMED: 'FILE_RENAMED',
  FILE_MOVED: 'FILE_MOVED',
  FILE_COPIED: 'FILE_COPIED',
  DIRECTORY_CREATED: 'DIRECTORY_CREATED',
  DIRECTORY_DELETED: 'DIRECTORY_DELETED',
  DIRECTORY_RENAMED: 'DIRECTORY_RENAMED',
  DIRECTORY_MOVED: 'DIRECTORY_MOVED',
} as const;

export type FileSystemEventType =
  (typeof FILE_SYSTEM_EVENTS)[keyof typeof FILE_SYSTEM_EVENTS];

// ==========================================
// 3. Process Events
// ==========================================
export const PROCESS_EVENTS = {
  PROCESS_CREATED: 'PROCESS_CREATED',
  PROCESS_STARTED: 'PROCESS_STARTED',
  PROCESS_PAUSED: 'PROCESS_PAUSED',
  PROCESS_RESUMED: 'PROCESS_RESUMED',
  PROCESS_STOPPED: 'PROCESS_STOPPED',
  PROCESS_TERMINATED: 'PROCESS_TERMINATED',
  PROCESS_RESTARTED: 'PROCESS_RESTARTED',
  PROCESS_ERROR: 'PROCESS_ERROR',
} as const;

export type ProcessEventType =
  (typeof PROCESS_EVENTS)[keyof typeof PROCESS_EVENTS];

// ==========================================
// 4. Application Events
// ==========================================
export const APPLICATION_EVENTS = {
  APP_REGISTERED: 'APP_REGISTERED',
  APP_UNREGISTERED: 'APP_UNREGISTERED',
  APP_INSTALLED: 'APP_INSTALLED',
  APP_UNINSTALLED: 'APP_UNINSTALLED',
  APP_LAUNCHING: 'APP_LAUNCHING',
  APP_STARTED: 'APP_STARTED',
  APP_PAUSED: 'APP_PAUSED',
  APP_RESUMED: 'APP_RESUMED',
  APP_STOPPING: 'APP_STOPPING',
  APP_STOPPED: 'APP_STOPPED',
  APP_CRASHED: 'APP_CRASHED',
  APP_OPENED: 'APP_OPENED',
  APP_CLOSED: 'APP_CLOSED',
  APP_ERROR: 'APP_ERROR',
} as const;

export type ApplicationEventType =
  (typeof APPLICATION_EVENTS)[keyof typeof APPLICATION_EVENTS];

// ==========================================
// 5. User & Session Events
// ==========================================
export const USER_EVENTS = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_SWITCHED: 'USER_SWITCHED',
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

export type UserEventType =
  (typeof USER_EVENTS)[keyof typeof USER_EVENTS];

// ==========================================
// 6. Storage Events
// ==========================================
export const STORAGE_EVENTS = {
  STORAGE_READY: 'STORAGE_READY',
  STORAGE_CHANGED: 'STORAGE_CHANGED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_WARNING: 'STORAGE_QUOTA_WARNING',
} as const;

export type StorageEventType =
  (typeof STORAGE_EVENTS)[keyof typeof STORAGE_EVENTS];

// ==========================================
// 7. Security & Permission Events
// ==========================================
export const SECURITY_EVENTS = {
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
} as const;

export type SecurityEventType =
  (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];

// ==========================================
// 8. Scheduler Events
// ==========================================
export const SCHEDULER_EVENTS = {
  SCHEDULER_STARTED: 'SCHEDULER_STARTED',
  SCHEDULER_STOPPED: 'SCHEDULER_STOPPED',
  PROCESS_SCHEDULED: 'PROCESS_SCHEDULED',
  PROCESS_DESCHEDULED: 'PROCESS_DESCHEDULED',
  QUANTUM_EXPIRED: 'QUANTUM_EXPIRED',
} as const;

export type SchedulerEventType =
  (typeof SCHEDULER_EVENTS)[keyof typeof SCHEDULER_EVENTS];

// ==========================================
// 9. Shell / Terminal Events
// ==========================================
export const SHELL_EVENTS = {
  SHELL_STARTED: 'SHELL_STARTED',
  SHELL_STOPPED: 'SHELL_STOPPED',
  COMMAND_EXECUTED: 'COMMAND_EXECUTED',
  COMMAND_FAILED: 'COMMAND_FAILED',
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_CLOSED: 'SESSION_CLOSED',
} as const;

export type ShellEventType =
  (typeof SHELL_EVENTS)[keyof typeof SHELL_EVENTS];

// ==========================================
// 10. Search Events
// ==========================================
export const SEARCH_EVENTS = {
  SEARCH_STARTED: 'SEARCH_STARTED',
  SEARCH_COMPLETED: 'SEARCH_COMPLETED',
  SEARCH_FAILED: 'SEARCH_FAILED',
  SEARCH_INDEX_UPDATED: 'SEARCH_INDEX_UPDATED',
  SEARCH_INDEX_REBUILT: 'SEARCH_INDEX_REBUILT',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED',
} as const;

export type SearchEventType =
  (typeof SEARCH_EVENTS)[keyof typeof SEARCH_EVENTS];

// ==========================================
// 11. Clipboard Events
// ==========================================
export const CLIPBOARD_EVENTS = {
  CLIPBOARD_CHANGED: 'CLIPBOARD_CHANGED',
  CLIPBOARD_CLEARED: 'CLIPBOARD_CLEARED',
  CLIPBOARD_COPIED: 'CLIPBOARD_COPIED',
  CLIPBOARD_CUT: 'CLIPBOARD_CUT',
  CLIPBOARD_PASTED: 'CLIPBOARD_PASTED',
  CLIPBOARD_ERROR: 'CLIPBOARD_ERROR',
} as const;

export type ClipboardEventType =
  (typeof CLIPBOARD_EVENTS)[keyof typeof CLIPBOARD_EVENTS];

// ==========================================
// 12. System Services Events
// ==========================================
export const SERVICE_EVENTS = {
  SERVICE_REGISTERED: 'service.registered',
  SERVICE_UNREGISTERED: 'service.unregistered',
  SERVICE_STARTING: 'service.starting',
  SERVICE_STARTED: 'service.started',
  SERVICE_PAUSED: 'service.paused',
  SERVICE_RESUMED: 'service.resumed',
  SERVICE_STOPPING: 'service.stopping',
  SERVICE_STOPPED: 'service.stopped',
  SERVICE_FAILED: 'service.failed',
  SERVICE_RESTARTED: 'service.restarted',
  SERVICE_HEALTH_CHANGED: 'service.healthChanged',
} as const;

export type ServiceEventType =
  (typeof SERVICE_EVENTS)[keyof typeof SERVICE_EVENTS];

// ==========================================
// 13. Resource Manager Events
// ==========================================
export const RESOURCE_EVENTS = {
  RESOURCE_SNAPSHOT_CREATED: 'resource.snapshotCreated',
  RESOURCE_MEMORY_WARNING: 'resource.memoryWarning',
  RESOURCE_STORAGE_WARNING: 'resource.storageWarning',
  RESOURCE_STORAGE_CRITICAL: 'resource.storageCritical',
  RESOURCE_LIMIT_REACHED: 'resource.limitReached',
  RESOURCE_HEALTH_CHANGED: 'resource.healthChanged',
} as const;

export type ResourceEventType =
  (typeof RESOURCE_EVENTS)[keyof typeof RESOURCE_EVENTS];

// ==========================================
// 14. Diagnostics Events
// ==========================================
export const DIAGNOSTICS_EVENTS = {
  DIAGNOSTICS_STARTED: 'diagnostics.started',
  DIAGNOSTICS_COMPLETED: 'diagnostics.completed',
  DIAGNOSTICS_FAILED: 'diagnostics.failed',
  DIAGNOSTICS_WARNING: 'diagnostics.warning',
  DIAGNOSTICS_CRITICAL: 'diagnostics.critical',
  DIAGNOSTICS_HEALTH_CHANGED: 'diagnostics.healthChanged',
  DIAGNOSTICS_ERROR_RECORDED: 'diagnostics.errorRecorded',
} as const;

export type DiagnosticsEventType =
  (typeof DIAGNOSTICS_EVENTS)[keyof typeof DIAGNOSTICS_EVENTS];

// ==========================================
// Combined All System Event Types
// ==========================================
export const SYSTEM_EVENT_TYPES = {
  ...SYSTEM_EVENTS,
  ...FILE_SYSTEM_EVENTS,
  ...PROCESS_EVENTS,
  ...APPLICATION_EVENTS,
  ...USER_EVENTS,
  ...STORAGE_EVENTS,
  ...SECURITY_EVENTS,
  ...SCHEDULER_EVENTS,
  ...SHELL_EVENTS,
  ...SEARCH_EVENTS,
  ...CLIPBOARD_EVENTS,
  ...SERVICE_EVENTS,
  ...RESOURCE_EVENTS,
  ...DIAGNOSTICS_EVENTS,
} as const;

export type SystemEventType =
  | SystemLifecycleEventType
  | FileSystemEventType
  | ProcessEventType
  | ApplicationEventType
  | UserEventType
  | StorageEventType
  | SecurityEventType
  | SchedulerEventType
  | ShellEventType
  | SearchEventType
  | ClipboardEventType
  | ServiceEventType
  | ResourceEventType
  | DiagnosticsEventType;
