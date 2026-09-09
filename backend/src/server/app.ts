/**
 * WebOS Backend Foundation - Fastify Application Factory
 * Decouples Fastify application creation from network socket binding.
 */

import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { loadConfig, type AppConfig } from './config.js';
import { createLogger } from '../common/logging/logger.js';
import { registerRequestLogging } from '../common/logging/request-logger.js';
import { registerRequestContext } from '../common/middleware/request-context.js';
import { registerSecurityMiddleware } from '../common/middleware/security.js';
import { registerResponseEnvelope } from '../common/middleware/response.js';
import { registerServerTiming } from '../common/middleware/timing.js';
import { registerContentTypeGuard } from '../common/middleware/content-type.js';
import { createGlobalErrorHandler } from '../common/errors/error-handler.js';
import { createNotFoundHandler } from '../common/errors/not-found-handler.js';
import { HealthService } from '../health/health.service.js';
import { registerRoutes } from './routes.js';
import { IdUtils } from '../common/utils/id.js';

import type { Phase1Services } from '../modules/phase1.container.js';

export interface AppFactoryOptions {
  readonly config?: AppConfig;
  readonly serverOptions?: Partial<FastifyServerOptions>;
  readonly healthService?: HealthService;
  readonly phase1Services?: Phase1Services;
}

export async function createApp(options: AppFactoryOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const logger = createLogger(config.logging, config.serviceName);
  const healthService = options.healthService ?? new HealthService(config.serviceName, config.version);

  // Fastify core instance creation
  const app = fastify({
    logger,
    genReqId: () => IdUtils.generateUuid(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    bodyLimit: config.server.maxPayloadSizeBytes,
    trustProxy: true,
    disableRequestLogging: true, // We handle request logging cleanly with structured request-logger hooks
    ...options.serverOptions
  });

  // Decorate Fastify instance with config and health registry
  app.decorate('config', config);
  app.decorate('healthRegistry', healthService.getRegistry());

  // 1. Security plugins (CORS and Secure Headers)
  await registerSecurityMiddleware(app, config);

  // 2. Request context & Request ID propagation
  await app.register(registerRequestContext);

  // 3. Response envelope & timing helpers
  await app.register(registerResponseEnvelope);
  await app.register(registerServerTiming);
  await app.register(registerContentTypeGuard);

  // 4. Structured request lifecycle logging
  registerRequestLogging(app);

  // 5. Global error handling and not-found handling
  app.setErrorHandler(createGlobalErrorHandler(config.isProduction));
  app.setNotFoundHandler(createNotFoundHandler(config.isProduction));

  // 6. Centralized route registration
  await registerRoutes(app, { healthService, phase1Services: options.phase1Services });

  return app;
}
