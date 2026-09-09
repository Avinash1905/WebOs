/**
 * @file RecoveryManager.ts
 * @description Storage health checking and error recovery manager for WebOS.
 */

import type { CacheManager } from './CacheManager.js';
import type { StorageAdapter } from './StorageAdapter.js';
import { StorageRecoveryError } from './StorageError.js';
import type { StorageHealthReport } from './types.js';

/**
 * Manages storage diagnostics, health validation, and automated recovery procedures.
 */
export class RecoveryManager {
  /**
   * Performs an active health check on the storage adapter by testing basic operations.
   */
  public async healthCheck(adapter: StorageAdapter): Promise<StorageHealthReport> {
    const start = Date.now();
    const testKey = `__health_check_${start}__`;
    const testVal = { probe: true, timestamp: start };

    try {
      // 1. Write test
      await adapter.set(testKey, testVal);

      // 2. Read test
      const readVal = await adapter.get<typeof testVal>(testKey);
      if (!readVal || readVal.probe !== true) {
        throw new Error('Health check read returned invalid payload.');
      }

      // 3. Delete test
      await adapter.delete(testKey);

      const latencyMs = Date.now() - start;

      return {
        healthy: true,
        adapter: adapter.name,
        initialized: true,
        latencyMs,
        details: { verifiedReadWrite: true },
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);

      return {
        healthy: false,
        adapter: adapter.name,
        initialized: false,
        latencyMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Attempts recovery of a malfunctioning storage adapter.
   *
   * @param adapter - The storage adapter to recover.
   * @param cache - The in-memory cache to invalidate/reset.
   * @returns True if recovery succeeded and storage is healthy.
   * @throws {StorageRecoveryError} If recovery steps fail.
   */
  public async attemptRecovery(
    adapter: StorageAdapter,
    cache: CacheManager
  ): Promise<boolean> {
    try {
      // 1. Flush corrupt cache entries
      cache.clear();

      // 2. Close active connection
      try {
        await adapter.close();
      } catch {
        // Safe ignore on close failure during recovery
      }

      // 3. Re-initialize storage adapter
      await adapter.initialize();

      // 4. Verify health after re-initialization
      const report = await this.healthCheck(adapter);
      if (!report.healthy) {
        throw new StorageRecoveryError(
          'healthCheck',
          `Health check failed after re-initialization: ${report.error}`
        );
      }

      return true;
    } catch (err) {
      if (err instanceof StorageRecoveryError) {
        throw err;
      }
      throw new StorageRecoveryError('recovery', 'Failed to recover storage connection.', err);
    }
  }
}
