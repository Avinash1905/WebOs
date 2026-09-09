/**
 * @file ResourceEvents.ts
 * @description Resource management event names.
 */

export const RESOURCE_EVENTS = {
  SNAPSHOT_CREATED: 'resource.snapshotCreated',
  MEMORY_WARNING: 'resource.memoryWarning',
  STORAGE_WARNING: 'resource.storageWarning',
  STORAGE_CRITICAL: 'resource.storageCritical',
  LIMIT_REACHED: 'resource.limitReached',
  HEALTH_CHANGED: 'resource.healthChanged',
} as const;

export type ResourceEventType = (typeof RESOURCE_EVENTS)[keyof typeof RESOURCE_EVENTS];
