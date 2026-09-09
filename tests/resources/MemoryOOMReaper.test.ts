import { describe, expect, it } from 'vitest';
import { MemoryOOMReaper } from '../../core/resources/index.js';

describe('Memory OOM Reaper', () => {
  it('MemoryOOMReaper selects victim with highest OOM score and protects low scores', () => {
    const processes = [
      { pid: 1, memoryUsedMB: 50, oomScoreAdj: -1000 }, // Protected kernel daemon
      { pid: 101, memoryUsedMB: 200, oomScoreAdj: 0 },    // Standard app
      { pid: 102, memoryUsedMB: 300, oomScoreAdj: 50 },   // High memory + high adj
    ];

    const victim = MemoryOOMReaper.calculateVictim(processes);
    expect(victim?.pid).toBe(102);
  });
});
