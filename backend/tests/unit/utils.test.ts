/**
 * WebOS Backend Foundation - Utilities Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { IdUtils } from '../../src/common/utils/id.js';
import { TimeUtils } from '../../src/common/utils/time.js';
import { ObjectUtils } from '../../src/common/utils/object.js';
import { StringUtils } from '../../src/common/utils/string.js';

describe('IdUtils', () => {
  it('should generate valid UUID v4', () => {
    const id = IdUtils.generateUuid();
    expect(id).toBeDefined();
    expect(IdUtils.isValidUuid(id)).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(IdUtils.isValidUuid('not-a-uuid')).toBe(false);
    expect(IdUtils.isValidUuid('')).toBe(false);
    expect(IdUtils.isValidUuid('12345678-1234-1234-1234-123456789012')).toBe(false);
  });

  it('should generate compact IDs with requested size', () => {
    const compact16 = IdUtils.generateCompactId(16);
    expect(compact16.length).toBe(16);

    const compact24 = IdUtils.generateCompactId(24);
    expect(compact24.length).toBe(24);
  });

  it('should generate prefixed identifiers', () => {
    const reqId = IdUtils.generatePrefixedId('req', 10);
    expect(reqId.startsWith('req_')).toBe(true);
    expect(reqId.length).toBe(14); // 4 for 'req_' + 10
  });
});

describe('TimeUtils', () => {
  it('should generate valid ISO timestamps and epoch milliseconds', () => {
    const nowMs = TimeUtils.nowMs();
    expect(nowMs).toBeGreaterThan(0);

    const nowIso = TimeUtils.nowIso();
    expect(new Date(nowIso).toISOString()).toBe(nowIso);
  });

  it('should calculate accurate duration using monotonic clock', async () => {
    const startNs = TimeUtils.monotonicNs();
    await TimeUtils.sleep(20);
    const duration = TimeUtils.durationMs(startNs);

    expect(duration).toBeGreaterThanOrEqual(15);
  });

  it('should format durations into human readable strings', () => {
    expect(TimeUtils.formatDuration(0.5)).toContain('µs');
    expect(TimeUtils.formatDuration(150.25)).toContain('ms');
    expect(TimeUtils.formatDuration(5200)).toContain('s');
    expect(TimeUtils.formatDuration(125000)).toContain('m');
  });
});

describe('ObjectUtils', () => {
  it('should deeply freeze nested objects', () => {
    const obj = {
      level1: {
        level2: {
          key: 'value'
        }
      }
    };

    const frozen = ObjectUtils.deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.level1)).toBe(true);
    expect(Object.isFrozen(frozen.level1.level2)).toBe(true);
  });

  it('should deeply clone objects and arrays', () => {
    const original = { a: 1, b: [1, 2, { c: 3 }], date: new Date() };
    const clone = ObjectUtils.deepClone(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.b).not.toBe(original.b);
  });

  it('should pick and omit keys correctly', () => {
    const obj = { a: 1, b: 2, c: 3 };

    const picked = ObjectUtils.pick(obj, ['a', 'c']);
    expect(picked).toEqual({ a: 1, c: 3 });

    const omitted = ObjectUtils.omit(obj, ['b']);
    expect(omitted).toEqual({ a: 1, c: 3 });
  });

  it('should mask sensitive keys recursively', () => {
    const data = {
      username: 'alex',
      password: 'mypassword',
      profile: {
        token: 'secret_token_123',
        bio: 'Hello world'
      }
    };

    const masked = ObjectUtils.maskKeys(data, ['password', 'token']);
    expect(masked.username).toBe('alex');
    expect(masked.password).toBe('[REDACTED]');
    expect((masked.profile as Record<string, unknown>).token).toBe('[REDACTED]');
    expect((masked.profile as Record<string, unknown>).bio).toBe('Hello world');
  });
});

describe('StringUtils', () => {
  it('should truncate strings exceeding maximum length', () => {
    expect(StringUtils.truncate('Hello World', 5)).toBe('He...');
    expect(StringUtils.truncate('Short', 10)).toBe('Short');
  });

  it('should normalize paths', () => {
    expect(StringUtils.normalizePath('///api///v1//users//')).toBe('/api/v1/users');
    expect(StringUtils.normalizePath('')).toBe('/');
  });

  it('should convert strings to kebab-case', () => {
    expect(StringUtils.toKebabCase('WebOsBackendModule')).toBe('web-os-backend-module');
    expect(StringUtils.toKebabCase('user_first_name')).toBe('user-first-name');
  });

  it('should safely parse JSON', () => {
    expect(StringUtils.safeJsonParse('{"valid": true}')).toEqual({ valid: true });
    expect(StringUtils.safeJsonParse('{invalid-json}')).toBeNull();
  });
});
