/**
 * WebOS Backend Foundation - Specific Error Subclasses
 */

import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';
import { HttpStatus } from '../types/http.types.js';

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
  readonly code?: string;
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: readonly ValidationIssue[] | unknown) {
    super(message, {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
      details
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName = 'Resource', resourceId?: string | number) {
    const message = resourceId !== undefined
      ? `${resourceName} with identifier '${resourceId}' was not found`
      : `${resourceName} was not found`;

    super(message, {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND
    });
  }
}

export class RouteNotFoundError extends AppError {
  constructor(method: string, path: string) {
    super(`Route ${method.toUpperCase()} '${path}' not found`, {
      code: ErrorCode.ROUTE_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
      details: { method, path }
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, {
      code: ErrorCode.UNAUTHORIZED,
      statusCode: HttpStatus.UNAUTHORIZED
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, {
      code: ErrorCode.FORBIDDEN,
      statusCode: HttpStatus.FORBIDDEN
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, {
      code: ErrorCode.CONFLICT,
      statusCode: HttpStatus.CONFLICT,
      details
    });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(maxSize?: number) {
    const message = maxSize !== undefined
      ? `Request payload exceeds maximum allowed size of ${maxSize} bytes`
      : 'Request payload too large';

    super(message, {
      code: ErrorCode.PAYLOAD_TOO_LARGE,
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      details: { maxSize }
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred', cause?: Error) {
    super(message, {
      code: ErrorCode.INTERNAL_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      cause,
      isOperational: false
    });
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway error received from upstream') {
    super(message, {
      code: ErrorCode.BAD_GATEWAY,
      statusCode: HttpStatus.BAD_GATEWAY,
      isOperational: true
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      isOperational: true
    });
  }
}
