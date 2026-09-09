/**
 * WebOS Backend Foundation - Configuration Schema & Validation
 */

import { z } from 'zod';
import type { AppConfig, RawEnv } from './config.types.js';

const LogLevelEnum = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
const EnvironmentEnum = z.enum(['development', 'production', 'test']);

/**
 * Raw environment variable validation schema
 */
export const RawEnvSchema = z.object({
  NODE_ENV: EnvironmentEnum.default('development'),
  HOST: z
    .string()
    .min(1, 'HOST cannot be empty')
    .default('127.0.0.1'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0).max(65535, 'PORT must be between 0 and 65535'))
    .default('3000'),
  LOG_LEVEL: LogLevelEnum.default('info'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://127.0.0.1:3000')
});

/**
 * Parser transforming validated raw environment into strongly typed AppConfig
 */
export function parseConfig(rawEnv: RawEnv): AppConfig {
  const parsed = RawEnvSchema.parse(rawEnv);

  const env = parsed.NODE_ENV;
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  const isTest = env === 'test';

  const origins = parsed.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    env,
    isProduction,
    isDevelopment,
    isTest,
    serviceName: 'webos-backend',
    version: '0.1.0',
    server: {
      host: parsed.HOST,
      port: parsed.PORT,
      shutdownTimeoutMs: 10000,
      maxPayloadSizeBytes: 1048576 // 1MB default
    },
    cors: {
      origins: origins.length > 0 ? origins : ['*'],
      credentials: true,
      maxAge: 86400
    },
    logging: {
      level: parsed.LOG_LEVEL,
      prettyPrint: isDevelopment,
      redactPaths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
        'password',
        'token',
        'secret',
        'accessToken',
        'refreshToken'
      ]
    }
  };
}
