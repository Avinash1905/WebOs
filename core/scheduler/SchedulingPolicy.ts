/**
 * @file SchedulingPolicy.ts
 * @description Priority-based Round Robin scheduling policy.
 */

import type { ProcessQueue } from './ProcessQueue.js';
import type { ProcessSchedulingInfo } from './types.js';

export interface SchedulingPolicy {
  readonly name: string;
  selectNext(queue: ProcessQueue): ProcessSchedulingInfo | null;
}

export class PriorityRoundRobinPolicy implements SchedulingPolicy {
  public readonly name = 'PriorityRoundRobin';

  public selectNext(queue: ProcessQueue): ProcessSchedulingInfo | null {
    return queue.dequeue();
  }
}
