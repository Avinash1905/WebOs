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
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
} as const;

export type UserEventType = (typeof USER_EVENTS)[keyof typeof USER_EVENTS];

// ==========================================
// 6. Storage Events
// ==========================================
export const STORAGE_EVENTS = {
  STORAGE_READY: 'STORAGE_READY',
  STORAGE_CHANGED: 'STORAGE_CHANGED',
  STORAGE_QUOTA_WARNING: 'STORAGE_QUOTA_WARNING',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;

export type StorageEventType =
  (typeof STORAGE_EVENTS)[keyof typeof STORAGE_EVENTS];

// ==========================================
// 7. Security & Permission Events
// ==========================================
export const SECURITY_EVENTS = {
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
} as const;

export type SecurityEventType =
  (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];

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
} as const;

export type SystemEventType =
  | SystemLifecycleEventType
  | FileSystemEventType
  | ProcessEventType
  | ApplicationEventType
  | UserEventType
  | StorageEventType
  | SecurityEventType;
