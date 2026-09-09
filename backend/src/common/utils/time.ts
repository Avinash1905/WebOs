/**
 * WebOS Backend Foundation - Time & Performance Utilities
 */

export const TimeUtils = {
  /**
   * Get current Unix epoch timestamp in milliseconds
   */
  nowMs(): number {
    return Date.now();
  },

  /**
   * Get current UTC timestamp in ISO 8601 format
   */
  nowIso(): string {
    return new Date().toISOString();
  },

  /**
   * Get high-resolution monotonic time in nanoseconds
   */
  monotonicNs(): bigint {
    return process.hrtime.bigint();
  },

  /**
   * Calculate duration in milliseconds from a starting monotonic nanosecond point
   */
  durationMs(startNs: bigint): number {
    const endNs = process.hrtime.bigint();
    const diffNs = endNs - startNs;
    return Number(diffNs) / 1_000_000;
  },

  /**
   * Format milliseconds into human readable string
   */
  formatDuration(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(0)}µs`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSecs}s`;
  },

  /**
   * Delay execution for specified milliseconds
   */
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
} as const;
