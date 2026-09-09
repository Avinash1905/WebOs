/**
 * @file SchedulerConfig.ts
 * @description Configuration defaults and resolution for the Process Scheduler.
 */

import type { ResolvedSchedulerConfig, SchedulerConfig } from './types.js';

export const DEFAULT_SCHEDULER_CONFIG: ResolvedSchedulerConfig = {
  defaultTimeSliceMs: 50,
  minTimeSliceMs: 10,
  maxTimeSliceMs: 500,
  autoStep: false,
  stepIntervalMs: 50,
  enableAging: true,
  agingThresholdMs: 5000,
} as const;

export function resolveSchedulerConfig(
  config?: SchedulerConfig
): ResolvedSchedulerConfig {
  return {
    defaultTimeSliceMs:
      config?.defaultTimeSliceMs ?? DEFAULT_SCHEDULER_CONFIG.defaultTimeSliceMs,
    minTimeSliceMs: config?.minTimeSliceMs ?? DEFAULT_SCHEDULER_CONFIG.minTimeSliceMs,
    maxTimeSliceMs: config?.maxTimeSliceMs ?? DEFAULT_SCHEDULER_CONFIG.maxTimeSliceMs,
    autoStep: config?.autoStep ?? DEFAULT_SCHEDULER_CONFIG.autoStep,
    stepIntervalMs:
      config?.stepIntervalMs ?? DEFAULT_SCHEDULER_CONFIG.stepIntervalMs,
    enableAging: config?.enableAging ?? DEFAULT_SCHEDULER_CONFIG.enableAging,
    agingThresholdMs:
      config?.agingThresholdMs ?? DEFAULT_SCHEDULER_CONFIG.agingThresholdMs,
  };
}
