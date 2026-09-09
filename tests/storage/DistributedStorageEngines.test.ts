import { describe, expect, it } from 'vitest';
import {
  LSMTreeStorageEngine,
  RaftStorageReplication,
  TwoPhaseCommitManager,
} from '../../core/storage/index.js';

describe('Distributed Storage Engines', () => {
  it('LSMTreeStorageEngine buffers in MemTable, flushes to SSTables, handles tombstones and compacts', () => {
    const lsm = new LSMTreeStorageEngine(2);

    lsm.put('k1', 'val1');
    lsm.put('k2', 'val2'); // Flushes to SSTable 1

    expect(lsm.get('k1')).toBe('val1');
    expect(lsm.get('k2')).toBe('val2');

    lsm.put('k3', 'val3');
    lsm.delete('k1'); // Tombstone

    expect(lsm.get('k1')).toBeNull();
    expect(lsm.get('k3')).toBe('val3');

    lsm.compact();
    expect(lsm.get('k1')).toBeNull();
    expect(lsm.get('k2')).toBe('val2');
    expect(lsm.get('k3')).toBe('val3');
  });

  it('RaftStorageReplication runs candidate elections, log appends and commit indexes', () => {
    const raft = new RaftStorageReplication('node_1');

    expect(raft.role).toBe('FOLLOWER');

    raft.startElection();
    expect(raft.role).toBe('CANDIDATE');
    expect(raft.term).toBe(1);

    raft.becomeLeader();
    expect(raft.role).toBe('LEADER');

    const log1 = raft.appendLog('SET x = 10');
    expect(log1.index).toBe(1);
    expect(raft.logLength).toBe(1);

    raft.commit(1);
    expect(raft.commitIndex).toBe(1);
  });

  it('TwoPhaseCommitManager coordinates distributed transactions across participants', () => {
    const tpc = new TwoPhaseCommitManager();

    tpc.registerParticipant('shard_1');
    tpc.registerParticipant('shard_2');

    tpc.vote('shard_1', true);
    tpc.vote('shard_2', true);

    const outcome = tpc.executeCoordinatorPhase();
    expect(outcome).toBe('COMMITTED');

    const abortTpc = new TwoPhaseCommitManager();
    abortTpc.registerParticipant('shard_1');
    abortTpc.registerParticipant('shard_2');

    abortTpc.vote('shard_1', true);
    abortTpc.vote('shard_2', false); // Vote NO

    const abortOutcome = abortTpc.executeCoordinatorPhase();
    expect(abortOutcome).toBe('ABORTED');
  });
});
