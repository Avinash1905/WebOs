/**
 * @file ServiceState.ts
 * @description State transition validator and state helpers for System Services.
 */

import { ServiceStateError } from './ServiceError.js';
import type { ServiceState } from './types.js';

const VALID_TRANSITIONS: Record<ServiceState, readonly ServiceState[]> = {
  REGISTERED: ['INITIALIZING', 'STARTING', 'STOPPED', 'FAILED'],
  INITIALIZING: ['INITIALIZED', 'FAILED'],
  INITIALIZED: ['STARTING', 'STOPPED', 'FAILED'],
  STARTING: ['RUNNING', 'FAILED'],
  RUNNING: ['PAUSED', 'STOPPING', 'FAILED'],
  PAUSED: ['RUNNING', 'STOPPING', 'FAILED'],
  STOPPING: ['STOPPED', 'FAILED'],
  STOPPED: ['STARTING', 'INITIALIZING', 'REGISTERED', 'FAILED'],
  FAILED: ['STARTING', 'INITIALIZING', 'STOPPED', 'REGISTERED'],
};

export function canTransition(from: ServiceState, to: ServiceState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(serviceId: string, from: ServiceState, to: ServiceState): void {
  if (!canTransition(from, to)) {
    throw new ServiceStateError(
      serviceId,
      from,
      VALID_TRANSITIONS[from]?.join(' | ') ?? 'NONE'
    );
  }
}
