/**
 * WebOS Backend Foundation - Service Contracts and Types
 */

import type { ILogger } from '../common/logging/logger.types.js';

export type ServiceState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'failed';

export interface ServiceMetadata {
  readonly name: string;
  readonly version?: string;
  readonly dependencies?: readonly string[];
}

export interface IService {
  readonly metadata: ServiceMetadata;
  getState(): ServiceState;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface ServiceContext {
  readonly logger: ILogger;
}
