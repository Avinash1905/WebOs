/**
 * @file types.ts
 * @description Core types and interfaces for the WebOS System Event Bus.
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
import type { SystemEventType } from './EventTypes.js';

/**
 * The master event map associating each SystemEventType with its corresponding payload.
 */
export interface SystemEventMap {
  // System / Kernel Lifecycle
  SYSTEM_INITIALIZING: SystemLifecyclePayload;
  SYSTEM_INITIALIZED: SystemLifecyclePayload;
  SYSTEM_STARTING: SystemLifecyclePayload;
  SYSTEM_STARTED: SystemLifecyclePayload;
  SYSTEM_STOPPING: SystemLifecyclePayload;
  SYSTEM_STOPPED: SystemLifecyclePayload;
  SYSTEM_ERROR: SystemErrorPayload;

  // File System
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

  // Process
  PROCESS_CREATED: ProcessCreatedPayload;
  PROCESS_STARTED: ProcessStartedPayload;
  PROCESS_PAUSED: ProcessPausedPayload;
  PROCESS_RESUMED: ProcessResumedPayload;
  PROCESS_STOPPED: ProcessStoppedPayload;
  PROCESS_TERMINATED: ProcessTerminatedPayload;
  PROCESS_RESTARTED: ProcessRestartedPayload;
  PROCESS_ERROR: ProcessErrorPayload;

  // Application
  APP_REGISTERED: AppRegisteredPayload;
  APP_UNREGISTERED: AppUnregisteredPayload;
  APP_LAUNCHING: AppLaunchingPayload;
  APP_STARTED: AppStartedPayload;
  APP_OPENED: AppOpenedPayload;
  APP_PAUSED: AppPausedPayload;
  APP_RESUMED: AppResumedPayload;
  APP_STOPPING: AppStoppingPayload;
  APP_STOPPED: AppStoppedPayload;
  APP_CLOSED: AppClosedPayload;
  APP_CRASHED: AppCrashedPayload;
  APP_ERROR: AppErrorPayload;

  // User & Session
  USER_CREATED: UserCreatedPayload;
  USER_UPDATED: UserUpdatedPayload;
  USER_DELETED: UserDeletedPayload;
  USER_LOGIN: UserLoginPayload;
  USER_LOGOUT: UserLogoutPayload;
  SESSION_STARTED: SessionStartedPayload;
  SESSION_ENDED: SessionEndedPayload;

  // Storage
  STORAGE_READY: StorageReadyPayload;
  STORAGE_CHANGED: StorageChangedPayload;
  STORAGE_QUOTA_WARNING: StorageQuotaWarningPayload;
  STORAGE_ERROR: StorageErrorPayload;

  // Security & Permissions
  PERMISSION_GRANTED: PermissionGrantedPayload;
  PERMISSION_DENIED: PermissionDeniedPayload;
  PERMISSION_REVOKED: PermissionRevokedPayload;
  SECURITY_VIOLATION: SecurityViolationPayload;

  // Scheduler
  SCHEDULER_STARTED: SchedulerLifecyclePayload;
  SCHEDULER_STOPPED: SchedulerLifecyclePayload;
  SCHEDULER_PAUSED: SchedulerLifecyclePayload;
  SCHEDULER_RESUMED: SchedulerLifecyclePayload;
  SCHEDULER_ERROR: SchedulerErrorPayload;
  PROCESS_SCHEDULED: ProcessScheduledPayload;
  PROCESS_PREEMPTED: ProcessPreemptedPayload;
  PROCESS_COMPLETED: ProcessCompletedPayload;
  PROCESS_PRIORITY_CHANGED: ProcessPriorityChangedPayload;

  // Shell
  SHELL_STARTED: ShellLifecyclePayload;
  SHELL_STOPPED: ShellLifecyclePayload;
  SHELL_SESSION_CREATED: ShellSessionPayload;
  SHELL_SESSION_CLOSED: ShellSessionPayload;
  COMMAND_STARTED: CommandStartedPayload;
  COMMAND_COMPLETED: CommandCompletedPayload;
  COMMAND_FAILED: CommandFailedPayload;

  // Search
  SEARCH_STARTED: SearchStartedPayload;
  SEARCH_COMPLETED: SearchCompletedPayload;
  SEARCH_FAILED: SearchFailedPayload;
  SEARCH_INDEX_UPDATED: SearchIndexUpdatedPayload;
  SEARCH_INDEX_REBUILT: SearchIndexRebuiltPayload;

  // Clipboard
  CLIPBOARD_CHANGED: ClipboardChangedPayload;
  CLIPBOARD_CLEARED: ClipboardClearedPayload;
  CLIPBOARD_COPIED: ClipboardCopiedPayload;
  CLIPBOARD_CUT: ClipboardCutPayload;
  CLIPBOARD_PASTED: ClipboardPastedPayload;
  CLIPBOARD_ERROR: ClipboardErrorPayload;
}

/**
 * Standardized envelope for every event dispatched through the WebOS Event Bus.
 */
export interface SystemEvent<T = unknown> {
  /** Unique identifier for the event dispatch */
  readonly id: string;
  /** The event type */
  readonly type: string;
  /** Unix timestamp in milliseconds when the event was emitted */
  readonly timestamp: number;
  /** Identifier of the module or service that originated the event */
  readonly source: string;
  /** The strongly-typed event payload */
  readonly payload: T;
  /** Optional correlation identifier for distributed tracing */
  readonly correlationId?: string;
  /** Optional ID of the user context under which the event occurred */
  readonly userId?: string;
  /** Optional PID of the process context */
  readonly processId?: number | string;
  /** Optional ID of the application context */
  readonly applicationId?: string;
}

/**
 * Options provided when emitting an event.
 */
export interface EventEmissionOptions {
  /** Source module name (e.g. 'kernel', 'filesystem', 'process-manager'). Defaults to 'system'. */
  readonly source?: string;
  /** Correlation ID for tracing multi-event operations */
  readonly correlationId?: string;
  /** Associated user ID */
  readonly userId?: string;
  /** Associated process ID */
  readonly processId?: number | string;
  /** Associated application ID */
  readonly applicationId?: string;
}

/**
 * Options provided when subscribing to an event.
 */
export interface SubscriptionOptions {
  /**
   * Listener priority. Higher numbers execute before lower numbers.
   * Listeners with equal priority execute in registration (FIFO) order.
   * Defaults to 0.
   */
  readonly priority?: number;
  /**
   * If true, the listener executes once and is automatically unsubscribed.
   * Defaults to false.
   */
  readonly once?: boolean;
}

/**
 * Typed listener callback function for a specific event type.
 */
export type EventListener<T = unknown> = (
  payload: T,
  event: SystemEvent<T>
) => void | Promise<void>;

/**
 * Wildcard / Global listener receiving all system event envelopes.
 */
export type GlobalEventListener = (
  event: SystemEvent<unknown>
) => void | Promise<void>;

/**
 * Function returned by subscribe to unregister the subscription.
 */
export type UnsubscribeFunction = () => void;

/**
 * Filter parameters for querying in-memory event history.
 */
export interface EventHistoryFilter {
  /** Filter by event type(s) */
  readonly type?: string | readonly string[];
  /** Filter by source identifier(s) */
  readonly source?: string | readonly string[];
  /** Minimum timestamp (inclusive) */
  readonly fromTimestamp?: number;
  /** Maximum timestamp (inclusive) */
  readonly toTimestamp?: number;
  /** Filter by correlation ID */
  readonly correlationId?: string;
  /** Filter by user ID */
  readonly userId?: string;
  /** Filter by process ID */
  readonly processId?: number | string;
  /** Filter by application ID */
  readonly applicationId?: string;
  /** Maximum number of records to return */
  readonly limit?: number;
}

/**
 * Diagnostic statistics for the Event Bus.
 */
export interface EventBusStats {
  /** Total number of events emitted since startup/reset */
  readonly emittedEvents: number;
  /** Total number of currently active subscriptions (including global) */
  readonly activeListeners: number;
  /** Number of events currently retained in history */
  readonly historySize: number;
  /** Map of event types to their emission counts */
  readonly eventCounts: Readonly<Record<string, number>>;
}

/**
 * Configuration options for the Event Bus.
 */
export interface EventBusConfig {
  /** Whether in-memory event history is enabled. Defaults to true. */
  readonly historyEnabled?: boolean;
  /** Maximum number of events to retain in history. Defaults to 500. */
  readonly maxHistorySize?: number;
  /** Threshold of listeners per event before a warning is logged. Defaults to 50. */
  readonly listenerWarningThreshold?: number;
  /** Whether to capture listener errors safely without throwing. Defaults to true. */
  readonly captureListenerErrors?: boolean;
  /** Default source identifier used when not specified. Defaults to 'system'. */
  readonly defaultSource?: string;
}

export type { SystemEventType };
