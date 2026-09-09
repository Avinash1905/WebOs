/**
 * @file MemoryMonitor.ts
 * @description Browser-safe memory monitoring without simulated/fake metrics.
 */

import type { MemoryUsageInfo } from './types.js';

export class MemoryMonitor {
  public static getMemoryUsage(): MemoryUsageInfo {
    const perf = typeof performance !== 'undefined' ? (performance as any) : undefined;
    const memory = perf?.memory;

    if (memory && typeof memory.usedJSHeapSize === 'number') {
      const usedBytes = memory.usedJSHeapSize;
      const totalBytes = memory.totalJSHeapSize;
      const limitBytes = memory.jsHeapSizeLimit;
      const percentUsed = limitBytes > 0 ? Number(((usedBytes / limitBytes) * 100).toFixed(1)) : 0;
      const status = percentUsed >= 90 ? 'CRITICAL' : percentUsed >= 75 ? 'WARNING' : 'HEALTHY';

      return {
        usedBytes,
        totalBytes,
        limitBytes,
        percentUsed,
        available: true,
        status,
      };
    }

    return {
      available: false,
      status: 'UNKNOWN',
    };
  }
}
