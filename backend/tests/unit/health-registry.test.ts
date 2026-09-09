/**
 * WebOS Backend Foundation - Health Check Registry Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { HealthCheckRegistry } from '../../src/health/health.registry.js';
import { TimeUtils } from '../../src/common/utils/time.js';

describe('HealthCheckRegistry', () => {
  it('should register and list health checks', () => {
    const registry = new HealthCheckRegistry('test-service', '1.0.0');

    registry.register('db', async () => ({ status: 'healthy' }));
    registry.register('cache', async () => ({ status: 'healthy' }));

    expect(registry.has('db')).toBe(true);
    expect(registry.has('cache')).toBe(true);
    expect(registry.has('nonexistent')).toBe(false);
    expect(registry.getRegisteredNames()).toEqual(['db', 'cache']);
  });

  it('should reject duplicate registration of the same check name', () => {
    const registry = new HealthCheckRegistry();
    registry.register('storage', async () => ({ status: 'healthy' }));

    expect(() => {
      registry.register('storage', async () => ({ status: 'healthy' }));
    }).toThrow("Health check with name 'storage' is already registered");
  });

  it('should unregister checks cleanly', () => {
    const registry = new HealthCheckRegistry();
    registry.register('temp', async () => ({ status: 'healthy' }));
    expect(registry.has('temp')).toBe(true);

    const removed = registry.unregister('temp');
    expect(removed).toBe(true);
    expect(registry.has('temp')).toBe(false);
  });

  it('should evaluate overall status as "ok" when all checks are healthy', async () => {
    const registry = new HealthCheckRegistry('webos', '0.1.0');
    registry.register('foundation', async () => ({ status: 'healthy', details: { ready: true } }));

    const report = await registry.runAll();
    expect(report.status).toBe('ok');
    expect(report.service).toBe('webos');
    expect(report.checks.length).toBe(1);
    expect(report.checks[0]?.status).toBe('healthy');
  });

  it('should evaluate overall status as "degraded" when a non-critical check fails or is degraded', async () => {
    const registry = new HealthCheckRegistry();
    registry.register('critical-check', async () => ({ status: 'healthy' }), { critical: true });
    registry.register('optional-cache', async () => ({ status: 'unhealthy', error: 'cache cold' }), { critical: false });

    const report = await registry.runAll();
    expect(report.status).toBe('degraded');
  });

  it('should evaluate overall status as "error" when a critical check fails', async () => {
    const registry = new HealthCheckRegistry();
    registry.register('critical-dep', async () => ({ status: 'unhealthy', error: 'service down' }), { critical: true });

    const report = await registry.runAll();
    expect(report.status).toBe('error');

    const readiness = await registry.runReadiness();
    expect(readiness.ready).toBe(false);
  });

  it('should handle check timeouts cleanly without hanging', async () => {
    const registry = new HealthCheckRegistry();
    registry.register(
      'slow-check',
      async () => {
        await TimeUtils.sleep(200);
        return { status: 'healthy' };
      },
      { timeoutMs: 30, critical: true }
    );

    const report = await registry.runAll();
    const slowResult = report.checks.find((c) => c.name === 'slow-check');
    expect(slowResult).toBeDefined();
    expect(slowResult?.status).toBe('unhealthy');
    expect(slowResult?.error).toContain('timed out after 30ms');
    expect(report.status).toBe('error');
  });
});
