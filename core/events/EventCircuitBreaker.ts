/**
 * @file EventCircuitBreaker.ts
 * @description Failure rate monitoring and isolation for event subscribers.
 */

export interface CircuitBreakerConfig {
  readonly failureThreshold?: number;
  readonly resetTimeoutMs?: number;
  readonly halfOpenSuccessThreshold?: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class EventCircuitBreaker {
  private _state: CircuitState = 'CLOSED';
  private _consecutiveFailures = 0;
  private _consecutiveSuccesses = 0;
  private _lastFailureTimestamp?: number;
  private readonly _config: Required<CircuitBreakerConfig>;

  constructor(config?: CircuitBreakerConfig) {
    this._config = {
      failureThreshold: config?.failureThreshold ?? 5,
      resetTimeoutMs: config?.resetTimeoutMs ?? 15000,
      halfOpenSuccessThreshold: config?.halfOpenSuccessThreshold ?? 2,
    };
  }

  public getState(): CircuitState {
    if (this._state === 'OPEN' && this._lastFailureTimestamp !== undefined) {
      const elapsed = Date.now() - this._lastFailureTimestamp;
      if (elapsed >= this._config.resetTimeoutMs) {
        this._state = 'HALF_OPEN';
        this._consecutiveSuccesses = 0;
      }
    }
    return this._state;
  }

  public canExecute(): boolean {
    return this.getState() !== 'OPEN';
  }

  public recordSuccess(): void {
    if (this._state === 'HALF_OPEN') {
      this._consecutiveSuccesses++;
      if (this._consecutiveSuccesses >= this._config.halfOpenSuccessThreshold) {
        this._state = 'CLOSED';
        this._consecutiveFailures = 0;
        this._consecutiveSuccesses = 0;
      }
    } else if (this._state === 'CLOSED') {
      this._consecutiveFailures = 0;
    }
  }

  public recordFailure(): void {
    this._lastFailureTimestamp = Date.now();
    this._consecutiveFailures++;

    if (this._state === 'HALF_OPEN' || this._consecutiveFailures >= this._config.failureThreshold) {
      this._state = 'OPEN';
    }
  }

  public reset(): void {
    this._state = 'CLOSED';
    this._consecutiveFailures = 0;
    this._consecutiveSuccesses = 0;
    this._lastFailureTimestamp = undefined;
  }
}
