/**
 * @file index.ts
 * @description WebOS Module 2 — System Event Bus barrel exports.
 */

// Event Bus Core Engine & History
export { EventBus } from './EventBus.js';
export { EventHistory } from './EventHistory.js';
export {
  SubscriptionRecord,
  sortSubscriptions,
} from './EventSubscription.js';

// Event Types & Category Constants
export {
  APPLICATION_EVENTS,
  type ApplicationEventType,
  FILE_SYSTEM_EVENTS,
  type FileSystemEventType,
  PROCESS_EVENTS,
  type ProcessEventType,
  SECURITY_EVENTS,
  type SecurityEventType,
  STORAGE_EVENTS,
  type StorageEventType,
  SYSTEM_EVENTS,
  SYSTEM_EVENT_TYPES,
  type SystemEventType,
  type SystemLifecycleEventType,
  USER_EVENTS,
  type UserEventType,
} from './EventTypes.js';

// Event Payloads
export type {
  AppClosedPayload,
  AppErrorPayload,
  AppOpenedPayload,
  AppRegisteredPayload,
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
  ProcessCreatedPayload,
  ProcessErrorPayload,
  ProcessPausedPayload,
  ProcessRestartedPayload,
  ProcessResumedPayload,
  ProcessStartedPayload,
  ProcessStoppedPayload,
  ProcessTerminatedPayload,
  SecurityViolationPayload,
  SessionEndedPayload,
  SessionStartedPayload,
  StorageChangedPayload,
  StorageErrorPayload,
  StorageQuotaWarningPayload,
  StorageReadyPayload,
  SystemErrorPayload,
  SystemLifecyclePayload,
  UserLoginPayload,
  UserLogoutPayload,
} from './EventPayloads.js';

// Error Hierarchy
export {
  EventEmissionError,
  EventError,
  InvalidEventBusConfigError,
  InvalidEventTypeError,
  InvalidListenerError,
} from './EventError.js';

// Types, Envelopes & Contracts
export type {
  EventBusConfig,
  EventBusStats,
  EventEmissionOptions,
  EventHistoryFilter,
  EventListener,
  GlobalEventListener,
  SubscriptionOptions,
  SystemEvent,
  SystemEventMap,
  UnsubscribeFunction,
} from './types.js';
