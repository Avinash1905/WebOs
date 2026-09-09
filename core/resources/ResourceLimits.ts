/**
 * @file ResourceLimits.ts
 * @description Default limits and limit validation utilities.
 */

import type { ResourceLimits } from './types.js';

export const DEFAULT_RESOURCE_LIMITS: Required<ResourceLimits> = {
  maxProcesses: 100,
  maxAppInstances: 50,
  maxClipboardHistory: 100,
  maxSearchResults: 500,
  storageWarningThresholdPercent: 80,
  storageCriticalThresholdPercent: 95,
};

export function resolveResourceLimits(custom?: ResourceLimits): Required<ResourceLimits> {
  return {
    maxProcesses: custom?.maxProcesses ?? DEFAULT_RESOURCE_LIMITS.maxProcesses,
    maxAppInstances: custom?.maxAppInstances ?? DEFAULT_RESOURCE_LIMITS.maxAppInstances,
    maxClipboardHistory: custom?.maxClipboardHistory ?? DEFAULT_RESOURCE_LIMITS.maxClipboardHistory,
    maxSearchResults: custom?.maxSearchResults ?? DEFAULT_RESOURCE_LIMITS.maxSearchResults,
    storageWarningThresholdPercent: custom?.storageWarningThresholdPercent ?? DEFAULT_RESOURCE_LIMITS.storageWarningThresholdPercent,
    storageCriticalThresholdPercent: custom?.storageCriticalThresholdPercent ?? DEFAULT_RESOURCE_LIMITS.storageCriticalThresholdPercent,
  };
}
