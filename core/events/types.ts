/**
 * @file types.ts
 * @description Type definitions and event mapping contracts for WebOS System Event Bus.
 */

import type {
  AppClosedPayload,
  AppCrashedPayload,
  AppErrorPayload,
  AppLaunchingPayload,
  AppOpenedPayload,
  AppPausedPayload,
  AppRegisteredPayload,
  AppResumedPayload,
  AppStartedPayload,
  AppStoppedPayload,
  AppStoppingPayload,
  AppUnregisteredPayload,
  ClipboardChangedPayload,
  ClipboardClearedPayload,
  ClipboardCopiedPayload,
  ClipboardCutPayload,
  ClipboardErrorPayload,
  ClipboardPastedPayload,
  CommandCompletedPayload,
  CommandFailedPayload,
  CommandStartedPayload,
  DirectoryCreatedPayload,
  DirectoryDeletedPayload,
  DirectoryMovedPayload,
  DirectoryRenamedPayload,
  FileCopiedPayload,
  FileCreatedPayload,
  FileDeletedPayload,
  FileMovedPayload,
  FileRenamedPayload,
  FileUpdatedPayload,
  PermissionDeniedPayload,
  PermissionGrantedPayload,
  PermissionRevokedPayload,
  ProcessCompletedPayload,
  ProcessCreatedPayload,
  ProcessErrorPayload,
  ProcessPausedPayload,
  ProcessPreemptedPayload,
  ProcessPriorityChangedPayload,
  ProcessRestartedPayload,
  ProcessResumedPayload,
  ProcessScheduledPayload,
  ProcessStartedPayload,
  ProcessStoppedPayload,
  ProcessTerminatedPayload,
  SchedulerErrorPayload,
  SchedulerLifecyclePayload,
  SearchCompletedPayload,
  SearchFailedPayload,
  SearchIndexRebuiltPayload,
  SearchIndexUpdatedPayload,
  SearchStartedPayload,
  SecurityViolationPayload,
  SessionEndedPayload,
  SessionStartedPayload,
  ShellLifecyclePayload,
  ShellSessionPayload,
  StorageChangedPayload,
  StorageErrorPayload,
  StorageQuotaWarningPayload,
  StorageReadyPayload,
  SystemErrorPayload,
  SystemLifecyclePayload,
  UserCreatedPayload,
  UserDeletedPayload,
  UserLoginPayload,
  UserLogoutPayload,
  UserUpdatedPayload,
} from './EventPayloads.js';

export interface SystemEvent<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
  readonly source: string;
  readonly correlationId?: string;
  readonly userId?: string;
  readonly processId?: number | string;
  readonly applicationId?: string;
}

export type EventListener<T = unknown> = (payload: T, event: SystemEvent<T>) => void | Promise<void>;
export type GlobalEventListener = (event: SystemEvent<unknown>) => void | Promise<void>;
export type UnsubscribeFunction = () => void;

export interface SubscriptionOptions {
  priority?: number;
  once?: boolean;
}

export interface EventEmissionOptions {
  source?: string;
  correlationId?: string;
  userId?: string;
  processId?: number | string;
  applicationId?: string;
  async?: boolean;
}

export interface EventBusConfig {
  historyEnabled?: boolean;
  maxHistorySize?: number;
  listenerWarningThreshold?: number;
  captureListenerErrors?: boolean;
  defaultSource?: string;
}

export interface EventBusStats {
  totalEmitted: number;
  activeSubscriptions: number;
  historySize: number;
  eventsByType: Record<string, number>;
  emittedEvents?: number;
  activeListeners?: number;
  eventCounts?: Record<string, number>;
}

export interface EventHistoryFilter {
  type?: string;
  source?: string;
  since?: number;
  until?: number;
  limit?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  correlationId?: string;
  userId?: string;
  processId?: number | string;
  applicationId?: string;
}

export interface SystemEventMap {
  SYSTEM_INITIALIZING: SystemLifecyclePayload;
  SYSTEM_INITIALIZED: SystemLifecyclePayload;
  SYSTEM_STARTING: SystemLifecyclePayload;
  SYSTEM_STARTED: SystemLifecyclePayload;
  SYSTEM_STOPPING: SystemLifecyclePayload;
  SYSTEM_STOPPED: SystemLifecyclePayload;
  SYSTEM_ERROR: SystemErrorPayload;

  FILE_CREATED: FileCreatedPayload;
  FILE_UPDATED: FileUpdatedPayload;
  FILE_DELETED: FileDeletedPayload;
  FILE_RENAMED: FileRenamedPayload;
  FILE_MOVED: FileMovedPayload;
  FILE_COPIED: FileCopiedPayload;
  DIRECTORY_CREATED: DirectoryCreatedPayload;
  DIRECTORY_DELETED: DirectoryDeletedPayload;
  DIRECTORY_RENAMED: DirectoryRenamedPayload;
  DIRECTORY_MOVED: DirectoryMovedPayload;

  PROCESS_CREATED: ProcessCreatedPayload;
  PROCESS_STARTED: ProcessStartedPayload;
  PROCESS_PAUSED: ProcessPausedPayload;
  PROCESS_RESUMED: ProcessResumedPayload;
  PROCESS_STOPPED: ProcessStoppedPayload;
  PROCESS_TERMINATED: ProcessTerminatedPayload;
  PROCESS_RESTARTED: ProcessRestartedPayload;
  PROCESS_ERROR: ProcessErrorPayload;

  APP_REGISTERED: AppRegisteredPayload;
  APP_UNREGISTERED: AppUnregisteredPayload;
  APP_INSTALLED: Record<string, unknown>;
  APP_UNINSTALLED: Record<string, unknown>;
  APP_LAUNCHING: AppLaunchingPayload;
  APP_STARTED: AppStartedPayload;
  APP_PAUSED: AppPausedPayload;
  APP_RESUMED: AppResumedPayload;
  APP_STOPPING: AppStoppingPayload;
  APP_STOPPED: AppStoppedPayload;
  APP_CRASHED: AppCrashedPayload;
  APP_OPENED: AppOpenedPayload;
  APP_CLOSED: AppClosedPayload;
  APP_ERROR: AppErrorPayload;

  USER_CREATED: UserCreatedPayload;
  USER_UPDATED: UserUpdatedPayload;
  USER_DELETED: UserDeletedPayload;
  USER_LOGIN: UserLoginPayload;
  USER_LOGGED_IN: UserLoginPayload;
  USER_LOGOUT: UserLogoutPayload;
  USER_LOGGED_OUT: UserLogoutPayload;
  USER_SWITCHED: SessionStartedPayload;
  SESSION_STARTED: SessionStartedPayload;
  SESSION_ENDED: SessionEndedPayload;
  SESSION_EXPIRED: SessionEndedPayload;

  STORAGE_READY: StorageReadyPayload;
  STORAGE_CHANGED: StorageChangedPayload;
  STORAGE_ERROR: StorageErrorPayload;
  STORAGE_QUOTA_WARNING: StorageQuotaWarningPayload;

  PERMISSION_GRANTED: PermissionGrantedPayload;
  PERMISSION_REVOKED: PermissionRevokedPayload;
  PERMISSION_DENIED: PermissionDeniedPayload;
  SECURITY_VIOLATION: SecurityViolationPayload;

  SCHEDULER_STARTED: SchedulerLifecyclePayload;
  SCHEDULER_STOPPED: SchedulerLifecyclePayload;
  SCHEDULER_ERROR: SchedulerErrorPayload;
  PROCESS_SCHEDULED: ProcessScheduledPayload;
  PROCESS_PREEMPTED: ProcessPreemptedPayload;
  PROCESS_COMPLETED: ProcessCompletedPayload;
  PROCESS_PRIORITY_CHANGED: ProcessPriorityChangedPayload;
  QUANTUM_EXPIRED: Record<string, unknown>;

  SHELL_STARTED: ShellLifecyclePayload;
  SHELL_STOPPED: ShellLifecyclePayload;
  COMMAND_STARTED: CommandStartedPayload;
  COMMAND_COMPLETED: CommandCompletedPayload;
  COMMAND_FAILED: CommandFailedPayload;
  COMMAND_EXECUTED: Record<string, unknown>;
  SESSION_CREATED: ShellSessionPayload;
  SESSION_CLOSED: ShellSessionPayload;

  SEARCH_STARTED: SearchStartedPayload;
  SEARCH_COMPLETED: SearchCompletedPayload;
  SEARCH_FAILED: SearchFailedPayload;
  SEARCH_INDEX_UPDATED: SearchIndexUpdatedPayload;
  SEARCH_INDEX_REBUILT: SearchIndexRebuiltPayload;
  SEARCH_PERFORMED: Record<string, unknown>;

  CLIPBOARD_CHANGED: ClipboardChangedPayload;
  CLIPBOARD_CLEARED: ClipboardClearedPayload;
  CLIPBOARD_COPIED: ClipboardCopiedPayload;
  CLIPBOARD_CUT: ClipboardCutPayload;
  CLIPBOARD_PASTED: ClipboardPastedPayload;
  CLIPBOARD_ERROR: ClipboardErrorPayload;

  'service.registered': Record<string, unknown>;
  'service.unregistered': Record<string, unknown>;
  'service.starting': Record<string, unknown>;
  'service.started': Record<string, unknown>;
  'service.paused': Record<string, unknown>;
  'service.resumed': Record<string, unknown>;
  'service.stopping': Record<string, unknown>;
  'service.stopped': Record<string, unknown>;
  'service.failed': Record<string, unknown>;
  'service.restarted': Record<string, unknown>;
  'service.healthChanged': Record<string, unknown>;

  'resource.snapshotCreated': Record<string, unknown>;
  'resource.memoryWarning': Record<string, unknown>;
  'resource.storageWarning': Record<string, unknown>;
  'resource.storageCritical': Record<string, unknown>;
  'resource.limitReached': Record<string, unknown>;
  'resource.healthChanged': Record<string, unknown>;

  'diagnostics.started': Record<string, unknown>;
  'diagnostics.completed': Record<string, unknown>;
  'diagnostics.failed': Record<string, unknown>;
  'diagnostics.warning': Record<string, unknown>;
  'diagnostics.critical': Record<string, unknown>;
  'diagnostics.healthChanged': Record<string, unknown>;
  'diagnostics.errorRecorded': Record<string, unknown>;

  [key: string]: unknown;
}
