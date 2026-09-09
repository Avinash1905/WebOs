/**
 * WebOS Backend Foundation - Error System Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCode,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  RouteNotFoundError,
  PayloadTooLargeError,
  BadGatewayError,
  ServiceUnavailableError,
  serializeError
} from '../../src/common/errors/index.js';
import { HttpStatus } from '../../src/common/types/http.types.js';

describe('Error Hierarchy', () => {
  it('should instantiate AppError with correct defaults', () => {
    const error = new AppError('Test error message', {
      code: ErrorCode.BAD_REQUEST,
      statusCode: HttpStatus.BAD_REQUEST
    });

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.timestamp).toBeDefined();
    expect(AppError.isAppError(error)).toBe(true);
  });

  it('should instantiate ValidationError with status 400', () => {
    const issues = [{ path: 'email', message: 'Invalid email' }];
    const error = new ValidationError('Invalid inputs', issues);

    expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual(issues);
  });

  it('should instantiate NotFoundError with formatted message and status 404', () => {
    const error = new NotFoundError('User', 'usr_123');

    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(error.message).toBe("User with identifier 'usr_123' was not found");
  });

  it('should instantiate RouteNotFoundError with method and path', () => {
    const error = new RouteNotFoundError('GET', '/api/v1/invalid');

    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(error.code).toBe(ErrorCode.ROUTE_NOT_FOUND);
    expect(error.message).toContain("Route GET '/api/v1/invalid' not found");
  });

  it('should instantiate UnauthorizedError with status 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should instantiate ForbiddenError with status 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('should instantiate ConflictError with status 409', () => {
    const error = new ConflictError('Email already registered');
    expect(error.statusCode).toBe(HttpStatus.CONFLICT);
    expect(error.code).toBe(ErrorCode.CONFLICT);
  });

  it('should instantiate PayloadTooLargeError with status 413', () => {
    const error = new PayloadTooLargeError(1048576);
    expect(error.statusCode).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(error.code).toBe(ErrorCode.PAYLOAD_TOO_LARGE);
  });

  it('should instantiate InternalServerError as non-operational with status 500', () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.isOperational).toBe(false);
  });

  it('should instantiate BadGatewayError and ServiceUnavailableError', () => {
    const badGateway = new BadGatewayError();
    expect(badGateway.statusCode).toBe(HttpStatus.BAD_GATEWAY);

    const serviceUnavailable = new ServiceUnavailableError();
    expect(serviceUnavailable.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });
});

describe('Error Serializer', () => {
  it('should serialize AppError into standard JSON envelope with requestId', () => {
    const error = new NotFoundError('Session', 'sess_abc');
    const serialized = serializeError(error, {
      requestId: 'req-test-123',
      isProduction: true
    });

    expect(serialized.success).toBe(false);
    expect(serialized.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(serialized.error.message).toContain('Session with identifier');
    expect(serialized.error.requestId).toBe('req-test-123');
    expect(serialized.error.stack).toBeUndefined(); // Must omit stack trace in production
  });

  it('should include stack trace in non-production mode', () => {
    const error = new ValidationError('Bad input');
    const serialized = serializeError(error, {
      requestId: 'req-test-456',
      isProduction: false
    });

    expect(serialized.error.stack).toBeDefined();
  });

  it('should mask sensitive keys in error details', () => {
    const error = new ValidationError('Invalid request body', {
      username: 'test_user',
      password: 'super_secret_password_123',
      nested: {
        token: 'secret_jwt_token'
      }
    });

    const serialized = serializeError(error, {
      requestId: 'req-test-789',
      isProduction: true
    });

    const details = serialized.error.details as Record<string, unknown>;
    expect(details.username).toBe('test_user');
    expect(details.password).toBe('[REDACTED]');
    expect((details.nested as Record<string, unknown>).token).toBe('[REDACTED]');
  });

  it('should sanitize generic unexpected Errors in production', () => {
    const rawError = new Error('Database password failed at C:\\Users\\secret\\db.js:45');
    const serialized = serializeError(rawError, {
      requestId: 'req-test-prod',
      isProduction: true
    });

    expect(serialized.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(serialized.error.message).toBe('An internal server error occurred');
    expect(serialized.error.stack).toBeUndefined();
  });
});
