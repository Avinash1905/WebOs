/**
 * WebOS Backend Foundation - Error Handling & Unknown Routes Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, createTestConfig } from '../helpers/test-server.js';
import { createApp } from '../../src/server/app.js';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
} from '../../src/common/errors/index.js';

describe('Global Error Handler & Unknown Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();

    // Register test routes throwing specific errors
    app.get('/test/validation-error', async () => {
      throw new ValidationError('Validation failed for field username', [
        { path: 'username', message: 'Must be at least 3 characters' }
      ]);
    });

    app.get('/test/unauthorized-error', async () => {
      throw new UnauthorizedError('Token expired');
    });

    app.get('/test/forbidden-error', async () => {
      throw new ForbiddenError('Insufficient permissions');
    });

    app.get('/test/conflict-error', async () => {
      throw new ConflictError('User already exists with this email');
    });

    app.get('/test/unexpected-error', async () => {
      throw new Error('Database connection dropped abruptly!');
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return structured 404 JSON for unknown global routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/this-path-does-not-exist-at-all'
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error.message).toContain("Route GET '/this-path-does-not-exist-at-all' not found");
    expect(body.error.requestId).toBeDefined();
  });

  it('should return structured 404 JSON for unknown /api/v1 routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/does-not-exist'
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error.requestId).toBeDefined();
  });

  it('should handle ValidationError with 400 status and include validation issues', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/validation-error'
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Validation failed for field username');
    expect(body.error.details).toBeDefined();
    expect(body.error.details[0].path).toBe('username');
  });

  it('should handle UnauthorizedError with 401 status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/unauthorized-error'
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Token expired');
  });

  it('should handle ForbiddenError with 403 status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/forbidden-error'
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toBe('Insufficient permissions');
  });

  it('should handle ConflictError with 409 status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/conflict-error'
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toBe('User already exists with this email');
  });

  it('should sanitize unexpected 500 errors in production mode without leaking stack trace', async () => {
    const prodConfig = createTestConfig({ NODE_ENV: 'production' });
    const prodApp = await createApp({
      config: prodConfig,
      serverOptions: { logger: false }
    });

    prodApp.get('/test/prod-unexpected', async () => {
      throw new Error('Secret DB password internal file path C:/db/secret.key');
    });

    await prodApp.ready();

    const res = await prodApp.inject({
      method: 'GET',
      url: '/test/prod-unexpected'
    });

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('An internal server error occurred');
    expect(body.error.stack).toBeUndefined(); // Strictly hidden in production
    expect(body.error.details).toBeUndefined();

    await prodApp.close();
  });
});
