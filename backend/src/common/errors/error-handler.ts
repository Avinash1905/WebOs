/**
 * WebOS Backend Foundation - Global Fastify Error Handler
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';
import { ValidationError } from './specific-errors.js';
import { serializeError } from './error-serializer.js';
import { HttpStatus } from '../types/http.types.js';

export function createGlobalErrorHandler(isProduction: boolean) {
  return function globalErrorHandler(
    error: FastifyError | AppError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ): void {
    const requestId = request.id || 'unknown-req';

    let normalizedError: AppError | Error = error;
    let statusCode = (error as FastifyError).statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;

    // Convert Fastify schema validation error into our structured ValidationError
    if ('validation' in error && error.validation) {
      statusCode = HttpStatus.BAD_REQUEST;
      const issues = Array.isArray(error.validation)
        ? error.validation.map((v) => ({
            path: (v.instancePath || v.params?.missingProperty || '').toString(),
            message: v.message || 'Invalid parameter',
            code: v.keyword
          }))
        : [{ path: '', message: error.message }];

      normalizedError = new ValidationError('Request validation failed', issues);
    } else if (AppError.isAppError(error)) {
      statusCode = error.statusCode;
    } else if (statusCode === HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
      normalizedError = new AppError(error.message || 'Unsupported media type', {
        code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
        statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE
      });
    } else if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE) {
      normalizedError = new AppError(error.message || 'Payload too large', {
        code: ErrorCode.PAYLOAD_TOO_LARGE,
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE
      });
    } else if (statusCode === HttpStatus.BAD_REQUEST) {
      normalizedError = new ValidationError(error.message);
    }

    // Structured logging of error
    if (statusCode >= 500) {
      request.log.error(
        {
          err: normalizedError,
          requestId,
          statusCode,
          method: request.method,
          url: request.url
        },
        `Unhandled server error: ${normalizedError.message}`
      );
    } else {
      request.log.warn(
        {
          err: normalizedError,
          requestId,
          statusCode,
          method: request.method,
          url: request.url
        },
        `Operational client error: ${normalizedError.message}`
      );
    }

    const payload = serializeError(normalizedError, {
      requestId,
      isProduction
    });

    reply.status(statusCode).type('application/json').send(payload);
  };
}
