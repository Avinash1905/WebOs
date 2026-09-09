import { describe, expect, it } from 'vitest';
import {
  EnergyAwareScheduler,
  NUMATopologyScheduler,
  DeadlockDetector,
  FairShareGroupScheduler,
} from '../../core/scheduler/index.js';

describe('Scheduler Deep Subsystems', () => {
  it('EnergyAwareScheduler chooses efficiency core for small workloads and performance core when preferred', () => {
    const eas = new EnergyAwareScheduler();

    // Small workload defaults to energy-efficient core (0-3)
    const eCore = eas.selectBestCore(100, false);
    expect(eCore).toBeGreaterThanOrEqual(0);
    expect(eCore).toBeLessThanOrEqual(3);

    // Performance preferred chooses P-core (4-7)
    const pCore = eas.selectBestCore(300, true);
    expect(pCore).toBeGreaterThanOrEqual(4);
    expect(pCore).toBeLessThanOrEqual(7);

    eas.assignTask(eCore, 100);
    const cores = eas.getCores();
    expect(cores[eCore]?.currentLoad).toBe(100);

    eas.releaseTask(eCore, 100);
    expect(cores[eCore]?.currentLoad).toBe(0);
  });

  it('NUMATopologyScheduler balances memory allocations and respects node distance matrix', () => {
    const numa = new NUMATopologyScheduler();

    // Preferred node 0 has capacity
    const bestNode0 = numa.findBestNodeForAllocation(0, 1024 * 1024);
    expect(bestNode0).toBe(0);

    numa.allocateMemory(0, 4 * 1024 * 1024 * 1024); // fill node 0

    // Next allocation shifts to node 1
    const bestNode1 = numa.findBestNodeForAllocation(0, 1024 * 1024);
    expect(bestNode1).toBe(1);

    numa.freeMemory(0, 4 * 1024 * 1024 * 1024);
    expect(numa.getNode(0)?.allocatedMemoryBytes).toBe(0);
  });

  it('DeadlockDetector detects cycles in Resource Allocation Graphs (Tarjan cycle detection)', () => {
    const detector = new DeadlockDetector();

    // P1 -> R1 -> P2 -> R2 -> P1 (Cycle)
    detector.addWaitEdge('P1', 'P2');
    detector.addWaitEdge('P2', 'P3');
    expect(detector.hasDeadlock()).toBe(false);

    detector.addWaitEdge('P3', 'P1'); // Cycle!
    expect(detector.hasDeadlock()).toBe(true);

    const cycles = detector.detectCycles();
    expect(cycles.length).toBeGreaterThan(0);

    // Resolve deadlock by removing edge
    detector.removeWaitEdge('P3', 'P1');
    expect(detector.hasDeadlock()).toBe(false);
  });

  it('FairShareGroupScheduler divides CPU tokens according to group share ratios', () => {
    const fss = new FairShareGroupScheduler();

    fss.registerGroup('system', 4); // 400 tokens max
    fss.registerGroup('user', 1);   // 100 tokens max

    const first = fss.selectGroupForExecution(50);
    expect(first).toBe('system'); // system has higher ratio

    fss.replenishTokens(2);
    expect(fss.getGroup('system')?.tokens).toBeGreaterThan(0);
  });
});
