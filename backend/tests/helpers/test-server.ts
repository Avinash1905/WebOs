/**
 * WebOS Backend Foundation - Test Server Harness
 */

import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/server/app.js';
import { parseConfig } from '../../src/common/config/config.schema.js';
import type { AppConfig, RawEnv } from '../../src/common/config/config.types.js';

export function createTestConfig(overrides: Partial<RawEnv> = {}): AppConfig {
  return parseConfig({
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '0',
    LOG_LEVEL: 'fatal', // Silence noisy logs during tests
    CORS_ORIGIN: '*',
    ...overrides
  });
}

export async function createTestApp(configOverrides: Partial<RawEnv> = {}): Promise<FastifyInstance> {
  const config = createTestConfig(configOverrides);
  const app = await createApp({
    config,
    serverOptions: {
      logger: false // Keep test output clean
    }
  });

  return app;
}
