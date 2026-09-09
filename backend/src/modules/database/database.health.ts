/**
 * WebOS Backend - Database Health Check Probe
 * Integrates database connectivity and latency metrics into the HealthCheckRegistry.
 */

import type { HealthCheckFn } from '../../health/health.types.js';
import type { PrismaService } from './prisma.service.js';

export function createDatabaseHealthCheck(prismaService: PrismaService): HealthCheckFn {
  return async () => {
    try {
      const { latencyMs } = await prismaService.ping();

      if (latencyMs > 1000) {
        return {
          status: 'degraded',
          details: {
            latencyMs,
            message: 'Database query latency is elevated'
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          latencyMs,
          connected: true
        }
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        status: 'unhealthy',
        error: errorMsg,
        details: {
          connected: false
        }
      };
    }
  };
}
