/**
 * @file types.ts
 * @description Core types and interfaces for the WebOS Kernel runtime and lifecycle engine.
 */

/**
 * Valid lifecycle states of the WebOS Kernel.
 */
export type KernelStatus =
  | 'CREATED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';

/**
 * Valid lifecycle states of an individual WebOS System Service.
 */
export type ServiceStatus =
  | 'REGISTERED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';

/**
 * Event types emitted during WebOS Kernel lifecycle transitions.
 */
export type KernelEventType =
  | 'SYSTEM_INITIALIZING'
  | 'SYSTEM_INITIALIZED'
  | 'SYSTEM_STARTING'
  | 'SYSTEM_STARTED'
  | 'SYSTEM_STOPPING'
  | 'SYSTEM_STOPPED'
  | 'SYSTEM_ERROR';

/**
 * Structure of a Kernel lifecycle event.
 */
export interface KernelEvent<T = unknown> {
  /** The type of lifecycle event */
  readonly type: KernelEventType;
  /** Unix timestamp in milliseconds when the event was emitted */
  readonly timestamp: number;
  /** Optional contextual payload associated with the event */
  readonly payload?: T;
  /** Optional error object if the event relates to a failure */
  readonly error?: Error;
}

/**
 * Listener callback function for Kernel lifecycle events.
 */
export type KernelEventListener<T = unknown> = (event: KernelEvent<T>) => void | Promise<void>;

/**
 * Snapshot representation of the Kernel's runtime state.
 */
export interface KernelStateSnapshot {
  /** Current status of the Kernel */
  readonly status: KernelStatus;
  /** Timestamp when the Kernel transitioned to RUNNING */
  readonly startedAt?: number;
  /** Timestamp when the Kernel transitioned to STOPPED */
  readonly stoppedAt?: number;
  /** Timestamp when the Kernel transitioned to FAILED */
  readonly failedAt?: number;
  /** The error that caused the Kernel to fail, if any */
  readonly error?: Error;
}

/**
 * Read-only information about a registered service.
 */
export interface ServiceInfo {
  /** Unique name identifier of the service */
  readonly name: string;
  /** Current lifecycle status of the service */
  readonly status: ServiceStatus;
  /** List of required service names this service depends on */
  readonly dependencies: readonly string[];
  /** List of optional service names this service can use if present */
  readonly optionalDependencies: readonly string[];
}
