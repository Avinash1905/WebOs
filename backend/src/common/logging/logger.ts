/**
 * WebOS Backend Foundation - Pino Structured Logger
 */

import pino from 'pino';
import type { LogConfig } from '../config/config.types.js';
import { DEFAULT_REDACT_PATHS } from './log-redaction.js';
import { LogContext } from './log-context.js';
import type { ILogger } from './logger.types.js';

export function createLogger(config: LogConfig, serviceName = 'webos-backend'): pino.Logger {
  const isDevelopment = config.prettyPrint;

  const transport = isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    : undefined;

  return pino({
    name: serviceName,
    level: config.level,
    transport,
    redact: {
      paths: [...DEFAULT_REDACT_PATHS, ...config.redactPaths],
      censor: '[REDACTED]'
    },
    formatters: {
      level(label) {
        return { level: label };
      },
      log(object) {
        const context = LogContext.getMetadata();
        return { ...context, ...object };
      }
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.ip,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length']
          }
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
          headers: {
            'content-type': res.headers?.['content-type'],
            'content-length': res.headers?.['content-length']
          }
        };
      },
      err: pino.stdSerializers.err
    },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}

/**
 * Root application logger instance
 */
let defaultLogger: pino.Logger | null = null;

export function getLogger(config?: LogConfig): pino.Logger {
  if (!defaultLogger) {
    const logConfig: LogConfig = config ?? {
      level: 'info',
      prettyPrint: false,
      redactPaths: []
    };
    defaultLogger = createLogger(logConfig);
  }
  return defaultLogger;
}

export function resetLogger(): void {
  defaultLogger = null;
}

export type { ILogger };
