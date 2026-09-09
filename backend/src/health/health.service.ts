/**
 * WebOS Backend Foundation - Health Service
 */

import { HealthCheckRegistry } from './health.registry.js';
import { createProcessHealthCheck } from './checks/process-health.js';
import { createSystemHealthCheck } from './checks/system-health.js';
import { TimeUtils } from '../common/utils/time.js';
import type {
  BasicHealthResponse,
  LivenessResponse,
  ReadinessResponse
} from './health.types.js';

export class HealthService {
  private readonly registry: HealthCheckRegistry;
  private readonly serviceName: string;
  private readonly version: string;

  constructor(serviceName = 'webos-backend', version = '0.1.0') {
    this.serviceName = serviceName;
    this.version = version;
    this.registry = new HealthCheckRegistry(serviceName, version);

    // Register backend foundation baseline checks
    this.registry.register('backend-foundation', createSystemHealthCheck(), {
      critical: true,
      timeoutMs: 2000
    });
    this.registry.register('process-memory', createProcessHealthCheck(), {
      critical: false,
      timeoutMs: 1500
    });
  }

  public getRegistry(): HealthCheckRegistry {
    return this.registry;
  }

  /**
   * Fast, lightweight health status (process-level only)
   */
  public getBasicHealth(): BasicHealthResponse {
    return {
      status: 'ok',
      service: this.serviceName,
      version: this.version,
      timestamp: TimeUtils.nowIso(),
      uptimeSeconds: Math.floor(process.uptime())
    };
  }

  /**
   * Liveness probe: confirms the process is alive and responsive
   */
  public getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      alive: true,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: TimeUtils.nowIso()
    };
  }

  /**
   * Readiness probe: checks all registered subsystem dependencies
   */
  public async getReadiness(): Promise<ReadinessResponse> {
    return this.registry.runReadiness();
  }
}
