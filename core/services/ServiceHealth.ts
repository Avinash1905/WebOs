/**
 * @file ServiceHealth.ts
 * @description Lightweight health tracker for individual system services.
 */

import type { ServiceHealthInfo, ServiceHealthStatus } from './types.js';

export class ServiceHealthTracker {
  private _status: ServiceHealthStatus = 'UNKNOWN';
  private _message?: string;
  private _startedAt: number | null = null;
  private _lastCheckedAt = Date.now();
  private _errorCount = 0;
  private _details: Record<string, unknown> = {};

  public recordStart(): void {
    this._startedAt = Date.now();
    this._status = 'HEALTHY';
    this._message = 'Service running normally';
    this._lastCheckedAt = Date.now();
  }

  public recordStop(): void {
    this._startedAt = null;
    this._status = 'UNKNOWN';
    this._message = 'Service stopped';
    this._lastCheckedAt = Date.now();
  }

  public recordError(error: Error | string): void {
    this._errorCount++;
    this._status = this._errorCount > 3 ? 'UNHEALTHY' : 'DEGRADED';
    this._message = typeof error === 'string' ? error : error.message;
    this._lastCheckedAt = Date.now();
  }

  public setStatus(status: ServiceHealthStatus, message?: string, details?: Record<string, unknown>): void {
    this._status = status;
    if (message) this._message = message;
    if (details) this._details = { ...this._details, ...details };
    this._lastCheckedAt = Date.now();
  }

  public getHealth(): ServiceHealthInfo {
    const uptimeMs = this._startedAt !== null ? Math.max(0, Date.now() - this._startedAt) : 0;
    return {
      status: this._status,
      message: this._message,
      lastCheckedAt: this._lastCheckedAt,
      uptimeMs,
      errorCount: this._errorCount,
      details: Object.keys(this._details).length > 0 ? Object.freeze({ ...this._details }) : undefined,
    };
  }

  public reset(): void {
    this._status = 'UNKNOWN';
    this._message = undefined;
    this._startedAt = null;
    this._lastCheckedAt = Date.now();
    this._errorCount = 0;
    this._details = {};
  }
}
