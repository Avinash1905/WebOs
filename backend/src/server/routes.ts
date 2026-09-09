/**
 * WebOS Backend Foundation - Centralized Route Registration & Versioning
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createHealthRoutes } from '../health/health.routes.js';
import type { HealthService } from '../health/health.service.js';
import { RouteNotFoundError } from '../common/errors/specific-errors.js';
import type { Phase1Services } from '../modules/phase1.container.js';
import { createAuthRoutes } from '../modules/auth/auth.routes.js';
import { createUserRoutes } from '../modules/users/user.routes.js';
import { createRoleRoutes, createPermissionRoutes } from '../modules/rbac/rbac.routes.js';
import { createSessionRoutes } from '../modules/sessions/session.routes.js';

export interface RouteRegistrationOptions {
  readonly healthService: HealthService;
  readonly phase1Services?: Phase1Services;
}

/**
 * Version 1 API Plugin
 * Mounts domain modules: auth, users, roles, permissions, sessions.
 */
export function createApiV1Routes(phase1Services?: Phase1Services): FastifyPluginAsync {
  return async (v1: FastifyInstance) => {
    // Standard API root endpoint providing version metadata
    v1.get('/', async (_req, reply) => {
      return reply.sendSuccess({
        version: 'v1',
        description: 'WebOS REST API v1',
        endpoints: {
          health: '/health',
          liveness: '/health/live',
          readiness: '/health/ready',
          ...(phase1Services
            ? {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                roles: '/api/v1/roles',
                permissions: '/api/v1/permissions',
                sessions: '/api/v1/sessions'
              }
            : {})
        }
      });
    });

    // Mount Phase 1 domain routes if services are provided
    if (phase1Services) {
      await v1.register(
        createAuthRoutes({
          controller: phase1Services.authController,
          authGuard: phase1Services.authGuard
        }),
        { prefix: '/auth' }
      );
      await v1.register(
        createUserRoutes({
          controller: phase1Services.userController,
          authGuard: phase1Services.authGuard,
          adminGuard: phase1Services.adminGuard
        }),
        { prefix: '/users' }
      );
      await v1.register(
        createRoleRoutes({
          controller: phase1Services.rbacController,
          authGuard: phase1Services.authGuard,
          adminGuard: phase1Services.adminGuard
        }),
        { prefix: '/roles' }
      );
      await v1.register(
        createPermissionRoutes({
          controller: phase1Services.rbacController,
          authGuard: phase1Services.authGuard
        }),
        { prefix: '/permissions' }
      );
      await v1.register(
        createSessionRoutes({
          controller: phase1Services.sessionController,
          authGuard: phase1Services.authGuard
        }),
        { prefix: '/sessions' }
      );
    }

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
  await app.register(createApiV1Routes(options.phase1Services), { prefix: '/api/v1' });
}
