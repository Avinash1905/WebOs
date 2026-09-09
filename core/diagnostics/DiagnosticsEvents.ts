/**
 * @file DiagnosticsEvents.ts
 * @description Diagnostic event constants.
 */

export const DIAGNOSTICS_EVENTS = {
  STARTED: 'diagnostics.started',
  COMPLETED: 'diagnostics.completed',
  FAILED: 'diagnostics.failed',
  WARNING: 'diagnostics.warning',
  CRITICAL: 'diagnostics.critical',
  HEALTH_CHANGED: 'diagnostics.healthChanged',
  ERROR_RECORDED: 'diagnostics.errorRecorded',
} as const;

export type DiagnosticsEventType = (typeof DIAGNOSTICS_EVENTS)[keyof typeof DIAGNOSTICS_EVENTS];
