import { describe, it, expect } from 'vitest';
import {
  EventStreamPipeline,
  EventSchemaRegistry,
  DistributedEventRelay,
  EventTelemetryDashboard,
  EventPriorityQueue
} from '../../core/events/index.js';

describe('Event Bus Deep Subsystems', () => {
  describe('EventStreamPipeline', () => {
    it('should transform and filter event data stream', async () => {
      const pipeline = new EventStreamPipeline<number>()
        .map(n => n * 2)
        .filter(n => n > 10)
        .map(n => `Result: ${n}`);

      const pass = await pipeline.process(8 as any);
      expect(pass.dropped).toBe(false);
      expect(pass.result).toBe('Result: 16');

      const drop = await pipeline.process(3 as any);
      expect(drop.dropped).toBe(true);
    });
  });

  describe('EventSchemaRegistry', () => {
    it('should validate payloads against schemas', () => {
      const registry = new EventSchemaRegistry();
      registry.registerSchema('USER_LOGIN', [
        { name: 'userId', type: 'string', required: true },
        { name: 'timestamp', type: 'number', required: true }
      ]);

      const valid = registry.validate('USER_LOGIN', { userId: 'u1', timestamp: Date.now() });
      expect(valid.valid).toBe(true);

      const invalid = registry.validate('USER_LOGIN', { userId: 123 });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  describe('DistributedEventRelay', () => {
    it('should tag events with causal vector clocks and drop duplicates', () => {
      const relayA = new DistributedEventRelay('node_A');
      const relayB = new DistributedEventRelay('node_B');

      const packet = relayA.packageEvent('SYS_ALERT', { level: 'CRITICAL' });
      const firstReceive = relayB.receivePacket(packet);
      expect(firstReceive.isNew).toBe(true);

      const secondReceive = relayB.receivePacket(packet);
      expect(secondReceive.isNew).toBe(false);
    });
  });

  describe('EventTelemetryDashboard', () => {
    it('should calculate percentile latencies and top events', () => {
      const dashboard = new EventTelemetryDashboard();
      dashboard.recordEvent('FILE_CREATED', 5);
      dashboard.recordEvent('FILE_CREATED', 10);
      dashboard.recordEvent('FILE_UPDATED', 20);

      expect(dashboard.getPercentileLatency(50)).toBeGreaterThan(0);
      expect(dashboard.getTopEvents(1)[0]?.eventType).toBe('FILE_CREATED');
    });
  });

  describe('EventPriorityQueue', () => {
    it('should dequeue highest priority events first', () => {
      const queue = new EventPriorityQueue();
      queue.enqueue('NORMAL_EVENT', {}, 10);
      queue.enqueue('PANIC_EVENT', {}, 0); // highest priority
      queue.enqueue('HIGH_EVENT', {}, 3);

      expect(queue.dequeue()?.eventType).toBe('PANIC_EVENT');
      expect(queue.dequeue()?.eventType).toBe('HIGH_EVENT');
      expect(queue.dequeue()?.eventType).toBe('NORMAL_EVENT');
    });
  });
});
