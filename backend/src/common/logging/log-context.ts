/**
 * WebOS Backend Foundation - Request-Scoped Log Context
 * Uses AsyncLocalStorage to make context available anywhere in call hierarchy.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { LogContextData } from './logger.types.js';

const storage = new AsyncLocalStorage<LogContextData>();

export const LogContext = {
  /**
   * Run an asynchronous function within a scoped log context
   */
  run<R>(context: LogContextData, fn: () => R): R {
    return storage.run(context, fn);
  },

  /**
   * Retrieve the current active log context
   */
  get(): LogContextData | undefined {
    return storage.getStore();
  },

  /**
   * Set or update properties on the current log context
   */
  set(updates: Partial<LogContextData>): void {
    const current = storage.getStore();
    if (current) {
      Object.assign(current, updates);
    }
  },

  /**
   * Extract standard metadata for log entries
   */
  getMetadata(): Record<string, unknown> {
    const store = storage.getStore();
    if (!store) return {};

    const metadata: Record<string, unknown> = {};
    if (store.requestId) metadata.requestId = store.requestId;
    if (store.correlationId) metadata.correlationId = store.correlationId;
    if (store.userId) metadata.userId = store.userId;
    if (store.sessionId) metadata.sessionId = store.sessionId;
    if (store.workspaceId) metadata.workspaceId = store.workspaceId;
    if (store.applicationId) metadata.applicationId = store.applicationId;

    return metadata;
  }
} as const;
