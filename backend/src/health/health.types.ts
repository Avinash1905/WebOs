/**
 * WebOS Backend Foundation - Health Monitoring Types
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  readonly name: string;
  readonly status: HealthStatus;
  readonly durationMs: number;
  readonly timestamp: string;
  readonly critical?: boolean;
  readonly details?: Record<string, unknown>;
  readonly error?: string;
}

export type HealthCheckFn = () => Promise<Omit<HealthCheckResult, 'name' | 'durationMs' | 'timestamp'>>;

export interface HealthCheckRegistration {
  readonly name: string;
  readonly checkFn: HealthCheckFn;
  readonly critical: boolean;
  readonly timeoutMs: number;
}

export interface ProcessMetrics {
  readonly uptimeSeconds: number;
  readonly pid: number;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly memory: {
    readonly heapUsedBytes: number;
    readonly heapTotalBytes: number;
    readonly rssBytes: number;
    readonly externalBytes: number;
  };
}

export interface OverallHealthReport {
  readonly status: 'ok' | 'degraded' | 'error';
  readonly service: string;
  readonly version: string;
  readonly timestamp: string;
  readonly uptimeSeconds: number;
  readonly checks: readonly HealthCheckResult[];
}

export interface BasicHealthResponse {
  readonly status: 'ok';
  readonly service: string;
  readonly version: string;
  readonly timestamp: string;
  readonly uptimeSeconds: number;
}

export interface LivenessResponse {
  readonly status: 'ok';
  readonly alive: true;
  readonly pid: number;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

export interface ReadinessResponse {
  readonly status: 'ok' | 'degraded' | 'error';
  readonly ready: boolean;
  readonly service: string;
  readonly version: string;
  readonly timestamp: string;
  readonly checks: readonly HealthCheckResult[];
}
