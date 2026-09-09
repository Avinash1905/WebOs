/**
 * WebOS Backend Foundation - Security Middleware (CORS & Secure Headers)
 */

import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { AppConfig } from '../config/config.types.js';
import { HttpHeader } from '../types/http.types.js';

export async function registerSecurityMiddleware(
  app: FastifyInstance,
  config: AppConfig
): Promise<void> {
  // Register Helmet secure headers
  await app.register(helmet, {
    contentSecurityPolicy: config.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
          }
        }
      : false, // In development, allow flexibility for developer tooling
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: config.isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false
  });

  // Register CORS
  const isAllOrigins = config.cors.origins.includes('*');
  const allowedOrigins = isAllOrigins ? true : (config.cors.origins as string[]);

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      HttpHeader.CONTENT_TYPE,
      HttpHeader.AUTHORIZATION,
      HttpHeader.X_REQUEST_ID,
      HttpHeader.X_CORRELATION_ID,
      'Accept'
    ],
    exposedHeaders: [
      HttpHeader.X_REQUEST_ID,
      HttpHeader.X_CORRELATION_ID,
      HttpHeader.X_RESPONSE_TIME,
      HttpHeader.SERVER_TIMING
    ],
    maxAge: config.cors.maxAge
  });
}
