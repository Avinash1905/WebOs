/**
 * WebOS Backend Foundation - Security & Response Middleware Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-server.js';

describe('Security & Response Middleware', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();

    app.get('/test/envelope-success', async (_req, reply) => {
      return reply.sendSuccess({ message: 'Operation successful', id: 42 });
    });

    app.post('/test/payload-endpoint', async (req, reply) => {
      return reply.sendSuccess({ received: req.body });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set security headers (Helmet)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('should include CORS exposed headers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        Origin: 'http://localhost:3000'
      }
    });

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should set Server-Timing and X-Response-Time headers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.headers['x-response-time']).toBeDefined();
    expect(res.headers['server-timing']).toBeDefined();
    expect(res.headers['server-timing']).toContain('total;dur=');
  });

  it('should wrap successful responses with standardized { success: true, data: ... } envelope', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/envelope-success'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ message: 'Operation successful', id: 42 });
  });

  it('should require Content-Type header on mutating requests with body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test/payload-endpoint',
      payload: '{"key":"value"}'
      // Note: intentionally omitting Content-Type header
    });

    // Content-Type missing on body request should be rejected
    expect(res.statusCode).toBe(415);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('should accept valid JSON payload with Content-Type application/json', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test/payload-endpoint',
      headers: {
        'content-type': 'application/json'
      },
      payload: JSON.stringify({ item: 'Widget A' })
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.received).toEqual({ item: 'Widget A' });
  });
});
