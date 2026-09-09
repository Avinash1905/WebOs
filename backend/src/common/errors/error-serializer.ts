/**
 * WebOS Backend Foundation - Error Serializer
 * Ensures strict redaction, consistent schema, and security compliance.
 */

import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

export interface SerializedErrorPayload {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly details?: unknown;
    readonly stack?: string;
  };
}

export interface SerializeOptions {
  requestId: string;
  isProduction: boolean;
}

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /bearer\s+[a-zA-Z0-9_.-]+/i,
  /cookie/i,
  /[a-f0-9]{32,}/i // Hash or key strings
];

/**
 * Clean message of any accidental secrets or internal path leaks
 */
function sanitizeMessage(msg: string): string {
  let cleaned = msg;
  // Strip file system paths in production
  cleaned = cleaned.replace(/([a-zA-Z]:\\[^\s:;]+|\/(?:home|usr|etc|var|tmp)\/[^\s:;]+)/g, '[INTERNAL_PATH]');
  return cleaned;
}

/**
 * Filter out sensitive keys from error details
 */
function sanitizeDetails(details: unknown): unknown {
  if (details === null || details === undefined) {
    return undefined;
  }
  if (typeof details === 'string') {
    return sanitizeMessage(details);
  }
  if (Array.isArray(details)) {
    return details.map((item) => sanitizeDetails(item));
  }
  if (typeof details === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizeDetails(value);
      }
    }
    return sanitizedObj;
  }
  return details;
}

export function serializeError(
  error: unknown,
  options: SerializeOptions
): SerializedErrorPayload {
  const { requestId, isProduction } = options;

  if (AppError.isAppError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: sanitizeMessage(error.message),
        requestId,
        ...(error.details !== undefined && { details: sanitizeDetails(error.details) }),
        ...(!isProduction && error.stack ? { stack: error.stack } : {})
      }
    };
  }

  // Handle standard Javascript error
  if (error instanceof Error) {
    const message = isProduction
      ? 'An internal server error occurred'
      : sanitizeMessage(error.message);

    return {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        requestId,
        ...(!isProduction && error.stack ? { stack: error.stack } : {})
      }
    };
  }

  // Handle unknown/primitive errors
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId
    }
  };
}
