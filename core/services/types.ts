/**
 * @file types.ts
 * @description Type definitions for the WebOS System Services Subsystem.
 */

import type { EventBus } from '../events/index.js';

export type ServiceState =
  | 'REGISTERED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';

export type ServiceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface ServiceHealthInfo {
  readonly status: ServiceHealthStatus;
  readonly message?: string;
  readonly lastCheckedAt: number;
  readonly uptimeMs: number;
  readonly errorCount: number;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface ServiceDescriptor {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly state: ServiceState;
  readonly dependencies?: readonly string[];
  readonly optionalDependencies?: readonly string[];
  readonly autoStart?: boolean;
  readonly config?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SystemService {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly dependencies?: readonly string[];
  readonly optionalDependencies?: readonly string[];
  readonly autoStart?: boolean;

  getStatus(): ServiceState;
  getHealth(): Promise<ServiceHealthInfo> | ServiceHealthInfo;

  initialize?(): Promise<void> | void;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
  pause?(): Promise<void> | void;
  resume?(): Promise<void> | void;
  restart?(): Promise<void> | void;
  reset?(): Promise<void> | void;
}

export interface ServiceManagerConfig {
  readonly autoStartRegistered?: boolean;
  readonly defaultTimeoutMs?: number;
  readonly eventBus?: EventBus;
}
