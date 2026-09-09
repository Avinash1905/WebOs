/**
 * WebOS Backend Foundation - Logging Types
 */

export type { LogLevel } from '../config/config.types.js';

export interface LogContextData {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  workspaceId?: string;
  applicationId?: string;
  [key: string]: unknown;
}

export interface ILogger {
  trace(msg: string, ...args: unknown[]): void;
  trace(obj: object, msg?: string, ...args: unknown[]): void;

  debug(msg: string, ...args: unknown[]): void;
  debug(obj: object, msg?: string, ...args: unknown[]): void;

  info(msg: string, ...args: unknown[]): void;
  info(obj: object, msg?: string, ...args: unknown[]): void;

  warn(msg: string, ...args: unknown[]): void;
  warn(obj: object, msg?: string, ...args: unknown[]): void;

  error(msg: string, ...args: unknown[]): void;
  error(obj: object, msg?: string, ...args: unknown[]): void;

  fatal(msg: string, ...args: unknown[]): void;
  fatal(obj: object, msg?: string, ...args: unknown[]): void;

  child(bindings: Record<string, unknown>): ILogger;
}

export interface RequestLogData {
  event: 'request_received' | 'request_completed' | 'request_error';
  requestId: string;
  method: string;
  url: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  contentLength?: number;
}
