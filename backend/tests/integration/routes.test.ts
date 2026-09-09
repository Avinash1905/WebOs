/**
 * WebOS Backend Foundation - Route Registration & Versioning Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-server.js';

describe('Centralized Route Registration & /api/v1', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1 should return API metadata and versioning information', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.version).toBe('v1');
    expect(body.data.description).toBe('WebOS REST API v1');
  });

  it('GET /api/v1/nonexistent should return structured 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/nonexistent-route'
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
