/**
 * @file StorageConfig.ts
 * @description Configuration options and defaults for the WebOS Storage Engine.
 */

import type { EventBus } from '../events/index.js';
import type { StorageAdapter } from './StorageAdapter.js';

/**
 * Options for configuring the WebOS Storage Engine.
 */
export interface StorageConfig {
  /**
   * Underlying storage driver. Can be 'indexeddb', 'memory', or a custom StorageAdapter instance.
   * Defaults to 'indexeddb' in browser environments, or 'memory' if IndexedDB is not available.
   */
  readonly adapter?: 'indexeddb' | 'memory' | StorageAdapter;

  /**
   * IndexedDB database name. Defaults to 'webos_storage'.
   */
  readonly databaseName?: string;

  /**
   * Schema version number for the database. Defaults to 1.
   */
  readonly version?: number;

  /**
   * Primary object store name. Defaults to 'os_data'.
   */
  readonly storeName?: string;

  /**
   * Whether in-memory LRU caching is enabled. Defaults to true.
   */
  readonly cacheEnabled?: boolean;

  /**
   * Maximum number of items in the LRU cache. Defaults to 500.
   */
  readonly maxCacheEntries?: number;

  /**
   * Fraction of quota usage (0.0 to 1.0) triggering a warning event. Defaults to 0.80 (80%).
   */
  readonly quotaWarningThreshold?: number;

  /**
   * Fraction of quota usage (0.0 to 1.0) considered critical. Defaults to 0.90 (90%).
   */
  readonly quotaCriticalThreshold?: number;

  /**
   * Whether automatic recovery is attempted on storage errors. Defaults to true.
   */
  readonly recoveryEnabled?: boolean;

  /**
   * Maximum retry attempts for transient storage errors. Defaults to 3.
   */
  readonly maxRetries?: number;

  /**
   * Optional EventBus instance for publishing STORAGE_* lifecycle and quota events.
   */
  readonly eventBus?: EventBus;
}

/**
 * Resolved and validated storage configuration with all defaults populated.
 */
export interface ResolvedStorageConfig {
  readonly adapter?: 'indexeddb' | 'memory' | StorageAdapter;
  readonly databaseName: string;
  readonly version: number;
  readonly storeName: string;
  readonly cacheEnabled: boolean;
  readonly maxCacheEntries: number;
  readonly quotaWarningThreshold: number;
  readonly quotaCriticalThreshold: number;
  readonly recoveryEnabled: boolean;
  readonly maxRetries: number;
  readonly eventBus?: EventBus;
}

/**
 * Default storage configuration values.
 */
export const DEFAULT_STORAGE_CONFIG: Omit<ResolvedStorageConfig, 'adapter' | 'eventBus'> = {
  databaseName: 'webos_storage',
  version: 1,
  storeName: 'os_data',
  cacheEnabled: true,
  maxCacheEntries: 500,
  quotaWarningThreshold: 0.80,
  quotaCriticalThreshold: 0.90,
  recoveryEnabled: true,
  maxRetries: 3,
};

/**
 * Resolves user-provided configuration with system defaults.
 */
export function resolveStorageConfig(userConfig?: StorageConfig): ResolvedStorageConfig {
  return {
    adapter: userConfig?.adapter,
    databaseName: userConfig?.databaseName ?? DEFAULT_STORAGE_CONFIG.databaseName,
    version: userConfig?.version ?? DEFAULT_STORAGE_CONFIG.version,
    storeName: userConfig?.storeName ?? DEFAULT_STORAGE_CONFIG.storeName,
    cacheEnabled: userConfig?.cacheEnabled ?? DEFAULT_STORAGE_CONFIG.cacheEnabled,
    maxCacheEntries: userConfig?.maxCacheEntries ?? DEFAULT_STORAGE_CONFIG.maxCacheEntries,
    quotaWarningThreshold:
      userConfig?.quotaWarningThreshold ?? DEFAULT_STORAGE_CONFIG.quotaWarningThreshold,
    quotaCriticalThreshold:
      userConfig?.quotaCriticalThreshold ?? DEFAULT_STORAGE_CONFIG.quotaCriticalThreshold,
    recoveryEnabled: userConfig?.recoveryEnabled ?? DEFAULT_STORAGE_CONFIG.recoveryEnabled,
    maxRetries: userConfig?.maxRetries ?? DEFAULT_STORAGE_CONFIG.maxRetries,
    eventBus: userConfig?.eventBus,
  };
}
