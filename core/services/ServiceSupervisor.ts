/**
 * @file ServiceSupervisor.ts
 * @description Systemd-style service supervision with exponential backoff restart policies.
 */

export type RestartPolicy = 'no' | 'always' | 'on-failure';

export interface SupervisedServiceConfig {
  readonly name: string;
  readonly restartPolicy: RestartPolicy;
  readonly maxRestarts: number;
  readonly backoffMs: number;
}

export interface ServiceSupervisionState {
  readonly name: string;
  restartCount: number;
  lastRestartAt: number;
  isFailed: boolean;
}

export class ServiceSupervisor {
  private readonly _services = new Map<string, SupervisedServiceConfig>();
  private readonly _states = new Map<string, ServiceSupervisionState>();

  public supervise(config: SupervisedServiceConfig): void {
    this._services.set(config.name, config);
    this._states.set(config.name, {
      name: config.name,
      restartCount: 0,
      lastRestartAt: 0,
      isFailed: false,
    });
  }

  public handleFailure(serviceName: string): { shouldRestart: boolean; delayMs: number } {
    const config = this._services.get(serviceName);
    const state = this._states.get(serviceName);

    if (!config || !state) {
      return { shouldRestart: false, delayMs: 0 };
    }

    if (config.restartPolicy === 'no') {
      state.isFailed = true;
      return { shouldRestart: false, delayMs: 0 };
    }

    if (state.restartCount >= config.maxRestarts) {
      state.isFailed = true;
      return { shouldRestart: false, delayMs: 0 };
    }

    state.restartCount += 1;
    state.lastRestartAt = Date.now();
    const delayMs = config.backoffMs * Math.pow(2, state.restartCount - 1);

    return { shouldRestart: true, delayMs };
  }

  public resetService(serviceName: string): void {
    const state = this._states.get(serviceName);
    if (state) {
      state.restartCount = 0;
      state.isFailed = false;
    }
  }

  public getState(serviceName: string): ServiceSupervisionState | undefined {
    return this._states.get(serviceName);
  }
}
