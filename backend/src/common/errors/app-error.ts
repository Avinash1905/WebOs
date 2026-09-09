/**
 * WebOS Backend Foundation - Base Application Error
 */

import { ErrorCode, DefaultErrorMessages } from './error-codes.js';
import { HttpStatus, type HttpStatusCode } from '../types/http.types.js';

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: HttpStatusCode;
  details?: unknown;
  cause?: Error;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(message?: string, options: AppErrorOptions = {}) {
    const code = options.code ?? ErrorCode.INTERNAL_ERROR;
    const defaultMsg = DefaultErrorMessages[code] ?? 'An application error occurred';
    const finalMessage = message || defaultMsg;

    super(finalMessage, { cause: options.cause });

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = options.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Determine whether an error is an instance of AppError
   */
  public static isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}
