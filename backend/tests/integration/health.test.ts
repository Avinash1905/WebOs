/**
 * WebOS Backend Foundation - Health Endpoints Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-server.js';
import { HealthService } from '../../src/health/health.service.js';
import { createApp } from '../../src/server/app.js';
import { createTestConfig } from '../helpers/test-server.js';

describe('Health Endpoints (/health, /health/live, /health/ready)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 with basic process health status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('webos-backend');
    expect(body.version).toBe('0.1.0');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /health/live should return 200 with liveness probe metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.alive).toBe(true);
    expect(body.pid).toBe(process.pid);
    expect(typeof body.uptimeSeconds).toBe('number');
  });

  it('GET /health/ready should return 200 when all critical checks pass', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/ready'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.ready).toBe(true);
    expect(Array.isArray(body.checks)).toBe(true);
    expect(body.checks.length).toBeGreaterThan(0);

    const foundationCheck = body.checks.find((c: { name: string }) => c.name === 'backend-foundation');
    expect(foundationCheck).toBeDefined();
    expect(foundationCheck.status).toBe('healthy');
  });

  it('GET /health/ready should return 503 when a registered critical check fails', async () => {
    const customHealthService = new HealthService('test-service', '0.1.0');
    customHealthService.getRegistry().register(
      'failing-subsystem',
      async () => ({ status: 'unhealthy', error: 'Connection refused' }),
      { critical: true }
    );

    const customApp = await createApp({
      config: createTestConfig(),
      healthService: customHealthService,
      serverOptions: { logger: false }
    });

    await customApp.ready();

    const res = await customApp.inject({
      method: 'GET',
      url: '/health/ready'
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('error');
    expect(body.ready).toBe(false);

    await customApp.close();
  });
});
