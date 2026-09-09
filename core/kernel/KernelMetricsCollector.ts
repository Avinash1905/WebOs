/**
 * @file KernelMetricsCollector.ts
 * @description Performance, latency, and uptime telemetry collector for the WebOS Kernel.
 */

export interface KernelTelemetryReport {
  readonly uptimeMs: number;
  readonly bootDurationMs?: number;
  readonly totalServiceStarts: number;
  readonly totalServiceStops: number;
  readonly totalServiceFailures: number;
  readonly totalPanics: number;
  readonly memoryFootprintEstimateBytes: number;
  readonly serviceLatenciesMs: Record<string, { startMs: number; stopMs: number; lastCheckedMs?: number }>;
  readonly timestamp: number;
}

export class KernelMetricsCollector {
  private _bootStartTime?: number;
  private _bootDurationMs?: number;
  private _initTimestamp: number = Date.now();
  private _serviceStarts = 0;
  private _serviceStops = 0;
  private _serviceFailures = 0;
  private _panicCount = 0;
  private readonly _serviceLatencies = new Map<string, { startMs: number; stopMs: number; lastCheckedMs?: number }>();

  public markBootStart(): void {
    this._bootStartTime = performance.now();
  }

  public markBootComplete(): void {
    if (this._bootStartTime !== undefined) {
      this._bootDurationMs = Number((performance.now() - this._bootStartTime).toFixed(2));
    }
  }

  public recordServiceStart(serviceName: string, durationMs: number): void {
    this._serviceStarts++;
    const current = this._serviceLatencies.get(serviceName) ?? { startMs: 0, stopMs: 0 };
    current.startMs = Number(durationMs.toFixed(2));
    this._serviceLatencies.set(serviceName, current);
  }

  public recordServiceStop(serviceName: string, durationMs: number): void {
    this._serviceStops++;
    const current = this._serviceLatencies.get(serviceName) ?? { startMs: 0, stopMs: 0 };
    current.stopMs = Number(durationMs.toFixed(2));
    this._serviceLatencies.set(serviceName, current);
  }

  public recordServiceFailure(_serviceName: string): void {
    this._serviceFailures++;
  }

  public recordPanic(): void {
    this._panicCount++;
  }

  public getReport(): KernelTelemetryReport {
    const latencies: Record<string, { startMs: number; stopMs: number; lastCheckedMs?: number }> = {};
    for (const [k, v] of this._serviceLatencies.entries()) {
      latencies[k] = { ...v };
    }

    return {
      uptimeMs: Math.max(0, Date.now() - this._initTimestamp),
      bootDurationMs: this._bootDurationMs,
      totalServiceStarts: this._serviceStarts,
      totalServiceStops: this._serviceStops,
      totalServiceFailures: this._serviceFailures,
      totalPanics: this._panicCount,
      memoryFootprintEstimateBytes: this._estimateMemoryUsage(),
      serviceLatenciesMs: latencies,
      timestamp: Date.now(),
    };
  }

  public reset(): void {
    this._initTimestamp = Date.now();
    this._serviceStarts = 0;
    this._serviceStops = 0;
    this._serviceFailures = 0;
    this._panicCount = 0;
    this._serviceLatencies.clear();
  }

  private _estimateMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize ?? 0;
    }
    return 0;
  }
}
