/**
 * WebOS Backend Foundation - System Foundation Health Check
 */

import type { HealthCheckFn } from '../health.types.js';
import { TimeUtils } from '../../common/utils/time.js';

export function createSystemHealthCheck(): HealthCheckFn {
  return async () => {
    const startMonotonic = TimeUtils.monotonicNs();

    // Check event loop responsiveness via a brief setImmediate cycle
    await new Promise<void>((resolve) => setImmediate(resolve));
    const eventLoopLagMs = TimeUtils.durationMs(startMonotonic);

    const isDegraded = eventLoopLagMs > 100; // Lag greater than 100ms indicates high load

    return {
      status: isDegraded ? 'degraded' : 'healthy',
      details: {
        subsystem: 'backend-foundation',
        eventLoopLagMs: parseFloat(eventLoopLagMs.toFixed(3)),
        timestamp: TimeUtils.nowIso()
      }
    };
  };
}
