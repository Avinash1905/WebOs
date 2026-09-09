/**
 * WebOS Backend Foundation - Fastify Type Augmentations
 */

import type { RequestContext } from './context.types.js';
import type { AppConfig } from '../config/config.types.js';
import type { HealthCheckRegistry } from '../../health/health.registry.js';

declare module 'fastify' {
  interface FastifyRequest {
    requestContext: RequestContext;
  }

  interface FastifyInstance {
    config: Readonly<AppConfig>;
    healthRegistry: HealthCheckRegistry;
  }

  interface FastifyReply {
    sendSuccess<T>(data: T, statusCode?: number): FastifyReply;
  }
}
