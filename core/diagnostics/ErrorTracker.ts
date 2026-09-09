/**
 * @file ErrorTracker.ts
 * @description Bounded FIFO in-memory error logger for OS Core runtime errors.
 */

import type { DiagnosticSeverity, TrackedError } from './types.js';

let errorCounter = 0;

export class ErrorTracker {
  private readonly _errors: TrackedError[] = [];
  private readonly _maxSize: number;

  constructor(maxSize = 100) {
    this._maxSize = Math.max(10, maxSize);
  }

  public record(
    subsystem: string,
    error: Error | string,
    severity: DiagnosticSeverity = 'MEDIUM',
    context?: Record<string, unknown>
  ): TrackedError {
    const message = typeof error === 'string' ? error : error.message;
    const code = (error as any)?.code ?? 'UNKNOWN_ERROR';

    const item: TrackedError = {
      id: `err_${Date.now()}_${++errorCounter}`,
      subsystem,
      code,
      message,
      severity,
      timestamp: Date.now(),
      context: context ? Object.freeze({ ...context }) : undefined,
    };

    this._errors.unshift(item);

    if (this._errors.length > this._maxSize) {
      this._errors.length = this._maxSize;
    }

    return item;
  }

  public getErrors(filter?: { subsystem?: string; severity?: DiagnosticSeverity }): readonly TrackedError[] {
    let result = this._errors;
    if (filter?.subsystem) {
      result = result.filter((e) => e.subsystem.toLowerCase() === filter.subsystem?.toLowerCase());
    }
    if (filter?.severity) {
      result = result.filter((e) => e.severity === filter.severity);
    }
    return Object.freeze([...result]);
  }

  public clear(): void {
    this._errors.length = 0;
  }

  public count(): number {
    return this._errors.length;
  }
}
