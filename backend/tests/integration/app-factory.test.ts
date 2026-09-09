/**
 * WebOS Backend Foundation - App Factory Integration Tests
 */

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-server.js';

describe('Fastify Application Factory (createApp)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should instantiate Fastify app with decorated config and health registry', () => {
    expect(app).toBeDefined();
    expect(app.config).toBeDefined();
    expect(app.config.serviceName).toBe('webos-backend');
    expect(app.healthRegistry).toBeDefined();
    expect(app.healthRegistry.has('backend-foundation')).toBe(true);
  });

  it('should respond to fastify.inject() without opening real network port', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
  });
});
