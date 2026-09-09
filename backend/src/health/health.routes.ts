/**
 * WebOS Backend Foundation - Health Routes
 * Handles GET /health, GET /health/live, GET /health/ready
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { HealthService } from './health.service.js';
import { HttpStatus } from '../common/types/http.types.js';

export function createHealthRoutes(healthService: HealthService): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    // GET /health - Lightweight process health endpoint
    app.get('/health', async (_request, reply) => {
      const basic = healthService.getBasicHealth();
      return reply.status(HttpStatus.OK).type('application/json').send(basic);
    });

    // GET /health/live - Kubernetes/Docker liveness probe
    app.get('/health/live', async (_request, reply) => {
      const live = healthService.getLiveness();
      return reply.status(HttpStatus.OK).type('application/json').send(live);
    });

    // GET /health/ready - Dependency readiness probe
    app.get('/health/ready', async (_request, reply) => {
      const readiness = await healthService.getReadiness();
      const statusCode = readiness.ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      return reply.status(statusCode).type('application/json').send(readiness);
    });
  };
}
