/**
 * WebOS Backend Foundation - Configuration Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { parseConfig, RawEnvSchema } from '../../src/common/config/config.schema.js';
import { validateAndLoadConfig, ConfigurationError } from '../../src/common/config/env.validator.js';
import { loadConfig, resetConfigCache } from '../../src/server/config.js';

describe('Configuration System', () => {
  it('should parse valid default environment', () => {
    const config = parseConfig({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: '3000',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'http://localhost:3000'
    });

    expect(config.env).toBe('development');
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.isTest).toBe(false);
    expect(config.server.host).toBe('127.0.0.1');
    expect(config.server.port).toBe(3000);
    expect(config.logging.level).toBe('info');
    expect(config.cors.origins).toEqual(['http://localhost:3000']);
  });

  it('should parse comma-separated CORS origins', () => {
    const config = parseConfig({
      CORS_ORIGIN: 'http://localhost:3000, https://webos.io, https://app.webos.io'
    });

    expect(config.cors.origins).toEqual([
      'http://localhost:3000',
      'https://webos.io',
      'https://app.webos.io'
    ]);
  });

  it('should reject invalid PORT values', () => {
    expect(() => {
      RawEnvSchema.parse({ PORT: 'not-a-number' });
    }).toThrow();

    expect(() => {
      RawEnvSchema.parse({ PORT: '70000' });
    }).toThrow();

    expect(() => {
      RawEnvSchema.parse({ PORT: '-1' });
    }).toThrow();
  });

  it('should reject invalid NODE_ENV values', () => {
    expect(() => {
      RawEnvSchema.parse({ NODE_ENV: 'staging' });
    }).toThrow();
  });

  it('should reject invalid LOG_LEVEL values', () => {
    expect(() => {
      RawEnvSchema.parse({ LOG_LEVEL: 'verbose' });
    }).toThrow();
  });

  it('should throw ConfigurationError with clear diagnostic messages on invalid config', () => {
    expect(() => {
      validateAndLoadConfig({
        PORT: 'invalid_port',
        LOG_LEVEL: 'invalid_level'
      });
    }).toThrow(ConfigurationError);

    try {
      validateAndLoadConfig({ PORT: '999999' });
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigurationError);
      const confErr = err as ConfigurationError;
      expect(confErr.issues.length).toBeGreaterThan(0);
    }
  });

  it('should return frozen immutable configuration from loadConfig', () => {
    resetConfigCache();
    const config = loadConfig({
      NODE_ENV: 'test',
      PORT: '4000'
    });

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.server)).toBe(true);
    expect(Object.isFrozen(config.cors)).toBe(true);
    expect(Object.isFrozen(config.logging)).toBe(true);

    // Mutation attempt should fail in strict mode
    expect(() => {
      // @ts-expect-error mutating readonly property
      config.server.port = 5000;
    }).toThrow();
  });
});
