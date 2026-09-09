/**
 * WebOS Backend Foundation - Health Check Registry
 * Extensible registry enabling future subsystems (database, storage, sync, ws)
 * to register custom liveness/readiness probes without modifying core server logic.
 */

import { TimeUtils } from '../common/utils/time.js';
import type {
  HealthCheckFn,
  HealthCheckRegistration,
  HealthCheckResult,
  OverallHealthReport,
  ReadinessResponse
} from './health.types.js';

export interface RegisterCheckOptions {
  readonly critical?: boolean;
  readonly timeoutMs?: number;
}

export class HealthCheckRegistry {
  private readonly checks: Map<string, HealthCheckRegistration> = new Map();
  private readonly serviceName: string;
  private readonly version: string;

  constructor(serviceName = 'webos-backend', version = '0.1.0') {
    this.serviceName = serviceName;
    this.version = version;
  }

  /**
   * Register a health probe for a subsystem
   */
  public register(
    name: string,
    checkFn: HealthCheckFn,
    options: RegisterCheckOptions = {}
  ): void {
    if (this.checks.has(name)) {
      throw new Error(`Health check with name '${name}' is already registered`);
    }

    this.checks.set(name, {
      name,
      checkFn,
      critical: options.critical ?? true,
      timeoutMs: options.timeoutMs ?? 3000
    });
  }

  /**
   * Unregister a health probe
   */
  public unregister(name: string): boolean {
    return this.checks.delete(name);
  }

  /**
   * Check whether a probe is registered
   */
  public has(name: string): boolean {
    return this.checks.has(name);
  }

  /**
   * List all registered check names
   */
  public getRegisteredNames(): readonly string[] {
    return Array.from(this.checks.keys());
  }

  /**
   * Execute a single check wrapped with timeout and duration tracking
   */
  private async executeCheck(reg: HealthCheckRegistration): Promise<HealthCheckResult> {
    const startNs = TimeUtils.monotonicNs();
    const timestamp = TimeUtils.nowIso();

    try {
      // Wrap with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Health check timed out after ${reg.timeoutMs}ms`));
        }, reg.timeoutMs);
      });

      const checkPromise = reg.checkFn();
      const rawResult = await Promise.race([checkPromise, timeoutPromise]);
      const durationMs = parseFloat(TimeUtils.durationMs(startNs).toFixed(2));

      return {
        name: reg.name,
        status: rawResult.status,
        durationMs,
        timestamp,
        critical: reg.critical,
        details: rawResult.details,
        error: rawResult.error
      };
    } catch (err) {
      const durationMs = parseFloat(TimeUtils.durationMs(startNs).toFixed(2));
      const errorMessage = err instanceof Error ? err.message : String(err);

      return {
        name: reg.name,
        status: 'unhealthy',
        durationMs,
        timestamp,
        critical: reg.critical,
        error: errorMessage
      };
    }
  }

  /**
   * Run all registered health checks concurrently and produce an aggregated report
   */
  public async runAll(): Promise<OverallHealthReport> {
    const registrations = Array.from(this.checks.values());
    const results = await Promise.all(registrations.map((reg) => this.executeCheck(reg)));

    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

    for (const res of results) {
      if (res.status === 'unhealthy' && res.critical) {
        overallStatus = 'error';
        break;
      }
      if (res.status === 'degraded' || (res.status === 'unhealthy' && !res.critical)) {
        overallStatus = 'degraded';
      }
    }

    return {
      status: overallStatus,
      service: this.serviceName,
      version: this.version,
      timestamp: TimeUtils.nowIso(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: results
    };
  }

  /**
   * Run readiness check: validates readiness of critical registered subsystems
   */
  public async runReadiness(): Promise<ReadinessResponse> {
    const report = await this.runAll();
    const isReady = report.status !== 'error';

    return {
      status: report.status,
      ready: isReady,
      service: this.serviceName,
      version: this.version,
      timestamp: report.timestamp,
      checks: report.checks
    };
  }
}
