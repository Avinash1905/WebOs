/**
 * WebOS Backend Foundation - Request ID & Context Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-server.js';
import { IdUtils } from '../../src/common/utils/id.js';

describe('Request ID & Context Propagation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate a valid UUID v4 request ID when no header is supplied by client', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const reqId = res.headers['x-request-id'] as string;
    expect(reqId).toBeDefined();
    expect(IdUtils.isValidUuid(reqId)).toBe(true);
  });

  it('should propagate incoming x-request-id header sent by client', async () => {
    const clientRequestId = 'custom-client-request-id-12345';
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': clientRequestId
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBe(clientRequestId);
  });

  it('should propagate x-correlation-id header', async () => {
    const correlationId = 'correlation-trace-abc-987';
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-correlation-id': correlationId
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });

  it('should include the identical request ID in structured error response bodies', async () => {
    const clientRequestId = 'custom-err-req-id-777';
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-endpoint-testing-req-id',
      headers: {
        'x-request-id': clientRequestId
      }
    });

    expect(res.statusCode).toBe(404);
    expect(res.headers['x-request-id']).toBe(clientRequestId);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.requestId).toBe(clientRequestId);
  });
});
