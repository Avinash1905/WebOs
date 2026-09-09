/**
 * @file DiagnosticsError.ts
 * @description Error hierarchy for WebOS Diagnostics Subsystem.
 */

export class DiagnosticsError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'DIAGNOSTICS_ERROR') {
    super(message);
    this.name = 'DiagnosticsError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CheckNotFoundError extends DiagnosticsError {
  constructor(checkId: string) {
    super(`Diagnostic check '${checkId}' was not found`, 'CHECK_NOT_FOUND');
    this.name = 'CheckNotFoundError';
  }
}
