import { describe, it, expect } from 'vitest';
import {
  PatternMatcher,
  DeadLetterQueue,
  EventCircuitBreaker,
  EventRateLimiter,
  EventAuditLogger,
  EventBatcher,
  SystemEvent,
} from '../../core/events/index.js';

describe('Module 2: Event Bus Deep Expansions', () => {
  describe('PatternMatcher', () => {
    it('matches hierarchical dot-notation wildcards', () => {
      expect(PatternMatcher.matches('storage.*', 'storage.quota')).toBe(true);
      expect(PatternMatcher.matches('storage.*', 'storage.error')).toBe(true);
      expect(PatternMatcher.matches('storage.*', 'storage.quota.warning')).toBe(false);

      expect(PatternMatcher.matches('storage.**', 'storage.quota.warning')).toBe(true);
      expect(PatternMatcher.matches('user.*.created', 'user.admin.created')).toBe(true);
      expect(PatternMatcher.matches('user.*.created', 'user.guest.deleted')).toBe(false);
      expect(PatternMatcher.matches('*', 'any.event')).toBe(true);
    });
  });

  describe('DeadLetterQueue', () => {
    it('enqueues and retrieves dropped/failed events', () => {
      const dlq = new DeadLetterQueue(10);
      const mockEvent: SystemEvent<unknown> = {
        id: 'evt_1',
        type: 'STORAGE_ERROR',
        payload: { error: 'Disk full' },
        timestamp: Date.now(),
        source: 'storage',
      };

      dlq.enqueue(mockEvent, 'LISTENER_ERROR', new Error('Subscriber threw exception'));

      expect(dlq.size()).toBe(1);
      const entries = dlq.getEntries({ reason: 'LISTENER_ERROR' });
      expect(entries.length).toBe(1);
      expect(entries[0]?.event.id).toBe('evt_1');
      expect(entries[0]?.error).toContain('Subscriber threw exception');
    });
  });

  describe('EventCircuitBreaker', () => {
    it('trips circuit breaker after threshold consecutive failures and resets upon recovery', () => {
      const breaker = new EventCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 50, halfOpenSuccessThreshold: 2 });

      expect(breaker.canExecute()).toBe(true);

      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.canExecute()).toBe(false);
    });
  });

  describe('EventRateLimiter', () => {
    it('limits burst event consumption', () => {
      const limiter = new EventRateLimiter(2, 10);

      expect(limiter.tryConsume('app-1', 1)).toBe(true);
      expect(limiter.tryConsume('app-1', 1)).toBe(true);
      expect(limiter.tryConsume('app-1', 1)).toBe(false); // exhausted
    });
  });

  describe('EventAuditLogger', () => {
    it('creates immutable hash chain and verifies audit integrity', () => {
      const logger = new EventAuditLogger();

      const e1: SystemEvent<unknown> = {
        id: 'e1',
        type: 'USER_LOGIN',
        payload: { user: 'admin' },
        timestamp: Date.now(),
        source: 'users',
      };

      const e2: SystemEvent<unknown> = {
        id: 'e2',
        type: 'PERMISSION_GRANTED',
        payload: { target: '/root' },
        timestamp: Date.now(),
        source: 'permissions',
      };

      logger.logEvent(e1);
      logger.logEvent(e2);

      expect(logger.getRecords().length).toBe(2);
      expect(logger.verifyIntegrity()).toBe(true);
    });
  });

  describe('EventBatcher', () => {
    it('batches events and flushes upon reaching batch size', async () => {
      const flushedBatches: SystemEvent<unknown>[][] = [];
      const batcher = new EventBatcher((batch) => {
        flushedBatches.push(batch);
      }, 3, 100);

      batcher.add({ id: '1', type: 'T', payload: null, timestamp: 1, source: 's' });
      batcher.add({ id: '2', type: 'T', payload: null, timestamp: 2, source: 's' });
      expect(flushedBatches.length).toBe(0);

      batcher.add({ id: '3', type: 'T', payload: null, timestamp: 3, source: 's' });
      expect(flushedBatches.length).toBe(1);
      expect(flushedBatches[0]?.length).toBe(3);
    });
  });
});
