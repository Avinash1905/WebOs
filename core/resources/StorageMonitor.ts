/**
 * @file StorageMonitor.ts
 * @description Storage resource monitor leveraging StorageEngine APIs.
 */

import type { StorageEngine } from '../storage/index.js';
import type { StorageResourceInfo } from './types.js';

export class StorageMonitor {
  public static async getStorageUsage(
    storage?: StorageEngine,
    warningPercent = 80,
    criticalPercent = 95
  ): Promise<StorageResourceInfo> {
    if (!storage) {
      return {
        usedBytes: 0,
        totalKeys: 0,
        status: 'UNKNOWN',
      };
    }

    try {
      const stats = await storage.getStats();
      const quota = await storage.getQuota();

      const usedBytes = stats.usedBytes ?? 0;
      const quotaBytes = quota?.quotaBytes;
      const percentUsed = quota?.percentUsed ?? (quotaBytes && quotaBytes > 0 ? Number(((usedBytes / quotaBytes) * 100).toFixed(1)) : undefined);

      let status: StorageResourceInfo['status'] = 'HEALTHY';
      if (percentUsed !== undefined) {
        if (percentUsed >= criticalPercent) status = 'CRITICAL';
        else if (percentUsed >= warningPercent) status = 'WARNING';
      }

      return {
        usedBytes,
        quotaBytes,
        percentUsed,
        totalKeys: stats.totalKeys ?? 0,
        status,
      };
    } catch {
      return {
        usedBytes: 0,
        totalKeys: 0,
        status: 'UNKNOWN',
      };
    }
  }
}
