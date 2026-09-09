/**
 * WebOS Backend Foundation - Centralized Route Registration & Versioning
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createHealthRoutes } from '../health/health.routes.js';
import type { HealthService } from '../health/health.service.js';
import { RouteNotFoundError } from '../common/errors/specific-errors.js';

export interface RouteRegistrationOptions {
  readonly healthService: HealthService;
}

/**
 * Version 1 API Plugin
 * Future domain modules (auth, users, files, sync) will be mounted here.
 */
export function createApiV1Routes(): FastifyPluginAsync {
  return async (v1: FastifyInstance) => {
    // Standard API root endpoint providing version metadata
    v1.get('/', async (_req, reply) => {
      return reply.sendSuccess({
        version: 'v1',
        description: 'WebOS REST API v1',
        endpoints: {
          health: '/health',
          liveness: '/health/live',
          readiness: '/health/ready'
        }
      });
    });

    // Fallback 404 for any unregistered endpoint under /api/v1/*
    v1.setNotFoundHandler((request, _reply) => {
      throw new RouteNotFoundError(request.method, request.url);
    });
  };
}

/**
 * Register all application routes (top-level and versioned namespaces)
 */
export async function registerRoutes(
  app: FastifyInstance,
  options: RouteRegistrationOptions
): Promise<void> {
  // Top-level Health endpoints (/health, /health/live, /health/ready)
  await app.register(createHealthRoutes(options.healthService));

  // Versioned API namespace: /api/v1
  await app.register(createApiV1Routes(), { prefix: '/api/v1' });
}
