import { describe, expect, it } from 'vitest';
import { WorkStealingPoolScheduler } from '../../core/scheduler/index.js';

describe('Work Stealing Pool Scheduler', () => {
  it('WorkStealingPoolScheduler executes local tasks and steals across workers', () => {
    const scheduler = new WorkStealingPoolScheduler(2);

    let ran1 = false;
    let ran2 = false;

    scheduler.submitTask(0, { id: 't1', fn: () => { ran1 = true; } });
    scheduler.submitTask(0, { id: 't2', fn: () => { ran2 = true; } });

    expect(scheduler.totalPendingTasks).toBe(2);

    // Worker 0 pops from tail
    const popped = scheduler.popTask(0);
    expect(popped?.id).toBe('t2');
    popped?.fn();
    expect(ran2).toBe(true);

    // Worker 1 steals from Worker 0's head
    const stolen = scheduler.popTask(1);
    expect(stolen?.id).toBe('t1');
    stolen?.fn();
    expect(ran1).toBe(true);

    expect(scheduler.totalPendingTasks).toBe(0);
  });
});
