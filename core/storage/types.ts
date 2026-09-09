/**
 * @file types.ts
 * @description Core types and interfaces for the WebOS Storage Engine.
 */

/**
 * Supported primitive and complex value types that can be stored in the Storage Engine.
 */
export type StorageValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | RegExp
  | Uint8Array
  | ArrayBuffer
  | StorageValue[]
  | { [key: string]: StorageValue };

/**
 * Internal storage entry envelope storing the serialized value and metadata.
 */
export interface StorageEntry<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly modifiedAt: number;
  readonly version?: number;
}

/**
 * Diagnostic statistics for the Storage Engine.
 */
export interface StorageStats {
  readonly reads: number;
  readonly writes: number;
  readonly deletes: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly cacheEntries: number;
  readonly totalKeys: number;
  readonly quotaBytes?: number;
  readonly usedBytes?: number;
  readonly availableBytes?: number;
}

/**
 * Structured report from a storage health check.
 */
export interface StorageHealthReport {
  readonly healthy: boolean;
  readonly adapter: string;
  readonly initialized: boolean;
  readonly latencyMs: number;
  readonly details?: Record<string, unknown>;
  readonly error?: string;
}

/**
 * Browser storage quota information.
 */
export interface QuotaInfo {
  readonly supported: boolean;
  readonly quotaBytes?: number;
  readonly usedBytes?: number;
  readonly availableBytes?: number;
  readonly percentUsed?: number;
}

/**
 * A single operation within a batch or transaction.
 */
export type BatchOperation =
  | { readonly type: 'set'; readonly key: string; readonly value: unknown }
  | { readonly type: 'delete'; readonly key: string };
