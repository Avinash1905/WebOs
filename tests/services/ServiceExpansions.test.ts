import { describe, it, expect } from 'vitest';
import {
  ServiceHealthProbe,
  ServiceConfigSchema,
  ServiceRPC
} from '../../core/services/index.js';

describe('Services Subsystem Expansions', () => {
  describe('ServiceHealthProbe', () => {
    it('should track probe history and consecutive failures', () => {
      const probe = new ServiceHealthProbe();
      probe.recordProbe('storage', true, 5);
      probe.recordProbe('network', false, 100);
      probe.recordProbe('network', false, 120);

      expect(probe.getConsecutiveFailures('storage')).toBe(0);
      expect(probe.getConsecutiveFailures('network')).toBe(2);
      expect(probe.getLatestProbe('storage')?.healthy).toBe(true);
    });
  });

  describe('ServiceConfigSchema', () => {
    it('should validate runtime service configurations against registered schema', () => {
      const schemaMgr = new ServiceConfigSchema();
      schemaMgr.registerSchema('event-bus', [
        { key: 'maxListeners', type: 'number', required: true },
        { key: 'debug', type: 'boolean', required: false }
      ]);

      const validRes = schemaMgr.validateConfig('event-bus', { maxListeners: 100, debug: true });
      expect(validRes.valid).toBe(true);

      const invalidRes = schemaMgr.validateConfig('event-bus', { maxListeners: 'not_a_number' });
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.errors.length).toBeGreaterThan(0);
    });
  });

  describe('ServiceRPC', () => {
    it('should register and execute remote RPC procedure calls with parameters', async () => {
      const rpc = new ServiceRPC();
      rpc.registerMethod('math.add', (params: any) => {
        return params.a + params.b;
      });

      const result = await rpc.invoke<number>('math.add', { a: 10, b: 25 });
      expect(result).toBe(35);
    });
  });
});
