/**
 * @file ServiceHealthProbe.ts
 * @description Background health probe and automated restart monitor for system services.
 */

export interface HealthProbeResult {
  readonly serviceName: string;
  readonly healthy: boolean;
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class ServiceHealthProbe {
  private readonly probeHistory = new Map<string, HealthProbeResult[]>();

  public recordProbe(serviceName: string, healthy: boolean, latencyMs: number, details?: Record<string, unknown>): HealthProbeResult {
    const result: HealthProbeResult = {
      serviceName,
      healthy,
      latencyMs,
      timestamp: Date.now(),
      details: details ? Object.freeze({ ...details }) : undefined
    };

    let history = this.probeHistory.get(serviceName);
    if (!history) {
      history = [];
      this.probeHistory.set(serviceName, history);
    }

    history.push(result);
    if (history.length > 50) history.shift();

    return result;
  }

  public getConsecutiveFailures(serviceName: string): number {
    const history = this.probeHistory.get(serviceName) ?? [];
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      if (item && !item.healthy) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  public getLatestProbe(serviceName: string): HealthProbeResult | undefined {
    const history = this.probeHistory.get(serviceName);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }
}
