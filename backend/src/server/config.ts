/**
 * WebOS Backend Foundation - Centralized Configuration System
 * No other file should access process.env directly.
 */

import { config as dotenvConfig } from 'dotenv';
import { validateAndLoadConfig } from '../common/config/env.validator.js';
import type { AppConfig, RawEnv } from '../common/config/config.types.js';
import { ObjectUtils } from '../common/utils/object.js';

let cachedConfig: Readonly<AppConfig> | null = null;

/**
 * Load and validate application configuration.
 * Returns an immutable, frozen AppConfig object.
 */
export function loadConfig(overrides: Partial<RawEnv> = {}): Readonly<AppConfig> {
  if (cachedConfig && Object.keys(overrides).length === 0) {
    return cachedConfig;
  }

  // Load .env into process.env if available
  dotenvConfig();

  const rawEnv: RawEnv = {
    NODE_ENV: overrides.NODE_ENV ?? process.env.NODE_ENV,
    HOST: overrides.HOST ?? process.env.HOST,
    PORT: overrides.PORT ?? process.env.PORT,
    LOG_LEVEL: overrides.LOG_LEVEL ?? process.env.LOG_LEVEL,
    CORS_ORIGIN: overrides.CORS_ORIGIN ?? process.env.CORS_ORIGIN
  };

  const parsedConfig = validateAndLoadConfig(rawEnv);
  const frozenConfig = ObjectUtils.deepFreeze(parsedConfig);

  if (Object.keys(overrides).length === 0) {
    cachedConfig = frozenConfig;
  }

  return frozenConfig;
}

/**
 * Reset cached configuration (primarily for test isolation)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

export { type AppConfig, type Environment, type LogLevel } from '../common/config/config.types.js';
export { ConfigurationError } from '../common/config/env.validator.js';
