import { describe, expect, it } from 'vitest';
import {
  KafkaStyleTopicPartition,
  EventSourcingAggregate,
  DeadLetterExchange,
} from '../../core/events/index.js';

describe('Event Streaming Broker Subsystems', () => {
  it('KafkaStyleTopicPartition appends log records, tracks offsets and commits consumer groups', () => {
    const partition = new KafkaStyleTopicPartition('sys_logs', 0);

    const off0 = partition.append('k1', 'val1');
    const off1 = partition.append('k2', 'val2');

    expect(off0).toBe(0);
    expect(off1).toBe(1);
    expect(partition.highWatermark).toBe(2);

    const records = partition.readFrom(0, 10);
    expect(records.length).toBe(2);
    expect(records[0]!.key).toBe('k1');

    partition.commitOffset('cg_analytics', 1);
    expect(partition.getCommittedOffset('cg_analytics')).toBe(1);
  });

  it('EventSourcingAggregate captures domain events and replays aggregate state', () => {
    const agg = new EventSourcingAggregate('user_42');

    agg.applyEvent('UserCreated', { name: 'Alice', email: 'alice@example.com' });
    agg.applyEvent('UserPromoted', { role: 'ADMIN' });

    expect(agg.version).toBe(2);
    expect(agg.getState()['name']).toBe('Alice');
    expect(agg.getState()['role']).toBe('ADMIN');

    const uncommitted = agg.getUncommittedChanges();
    expect(uncommitted.length).toBe(2);

    // Test replay on fresh instance
    const fresh = new EventSourcingAggregate('user_42');
    fresh.replay(uncommitted);
    expect(fresh.version).toBe(2);
    expect(fresh.getState()['role']).toBe('ADMIN');
  });

  it('DeadLetterExchange isolates poisoned messages and replays up to maxRetries', () => {
    const dlq = new DeadLetterExchange(2);

    dlq.routeToDlq('orders', { id: 101 }, 'Timeout connecting to DB');
    expect(dlq.getQuarantinedCount()).toBe(1);

    // 1st replay
    const batch1 = dlq.prepareReplay();
    expect(batch1.length).toBe(1);
    expect(batch1[0]!.retryCount).toBe(1);

    // Route back upon failure
    dlq.routeToDlq('orders', { id: 101 }, 'Second timeout');

    // 2nd replay
    const batch2 = dlq.prepareReplay();
    expect(batch2.length).toBe(1);
  });
});
