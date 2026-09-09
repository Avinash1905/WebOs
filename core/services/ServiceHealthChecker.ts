/**
 * @file ServiceHealthChecker.ts
 * @description Liveness, readiness, and startup health probes with configurable thresholds.
 */

export interface HealthProbe {
  readonly serviceName: string;
  readonly check: () => Promise<boolean> | boolean;
  readonly failureThreshold: number;
  consecutiveFailures: number;
  isHealthy: boolean;
}

export class ServiceHealthChecker {
  private readonly _probes = new Map<string, HealthProbe>();

  public registerProbe(serviceName: string, check: () => Promise<boolean> | boolean, failureThreshold: number = 3): void {
    this._probes.set(serviceName, {
      serviceName,
      check,
      failureThreshold,
      consecutiveFailures: 0,
      isHealthy: true,
    });
  }

  public async runCheck(serviceName: string): Promise<boolean> {
    const probe = this._probes.get(serviceName);
    if (!probe) return true;

    let passed = false;
    try {
      passed = await probe.check();
    } catch {
      passed = false;
    }

    if (passed) {
      probe.consecutiveFailures = 0;
      probe.isHealthy = true;
    } else {
      probe.consecutiveFailures += 1;
      if (probe.consecutiveFailures >= probe.failureThreshold) {
        probe.isHealthy = false;
      }
    }

    return probe.isHealthy;
  }

  public isServiceHealthy(serviceName: string): boolean {
    const probe = this._probes.get(serviceName);
    return probe ? probe.isHealthy : true;
  }
}
