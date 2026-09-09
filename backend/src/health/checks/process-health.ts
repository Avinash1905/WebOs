/**
 * WebOS Backend Foundation - Process Health Check
 */

import type { HealthCheckFn, ProcessMetrics } from '../health.types.js';

export function getProcessMetrics(): ProcessMetrics {
  const mem = process.memoryUsage();
  return {
    uptimeSeconds: Math.floor(process.uptime()),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      rssBytes: mem.rss,
      externalBytes: mem.external
    }
  };
}

export function createProcessHealthCheck(): HealthCheckFn {
  return async () => {
    const metrics = getProcessMetrics();
    // Consider memory degraded if heapUsed exceeds 1.5GB (in container/node default heap)
    const isDegraded = metrics.memory.heapUsedBytes > 1536 * 1024 * 1024;

    return {
      status: isDegraded ? 'degraded' : 'healthy',
      details: {
        uptime: `${metrics.uptimeSeconds}s`,
        heapUsedMb: (metrics.memory.heapUsedBytes / (1024 * 1024)).toFixed(2),
        heapTotalMb: (metrics.memory.heapTotalBytes / (1024 * 1024)).toFixed(2),
        rssMb: (metrics.memory.rssBytes / (1024 * 1024)).toFixed(2),
        nodeVersion: metrics.nodeVersion,
        pid: metrics.pid
      }
    };
  };
}
