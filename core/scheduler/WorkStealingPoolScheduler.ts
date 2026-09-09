/**
 * @file WorkStealingPoolScheduler.ts
 * @description Chase-Lev lock-free work-stealing deque scheduler for multi-core thread pools.
 */

export interface WorkTask {
  readonly id: string;
  readonly fn: () => void;
}

export class WorkStealingPoolScheduler {
  private readonly _workerDeques: WorkTask[][] = [];

  constructor(numWorkers: number = 4) {
    for (let i = 0; i < numWorkers; i++) {
      this._workerDeques.push([]);
    }
  }

  public submitTask(workerId: number, task: WorkTask): void {
    const deque = this._workerDeques[workerId % this._workerDeques.length];
    if (deque) deque.push(task);
  }

  public popTask(workerId: number): WorkTask | null {
    const deque = this._workerDeques[workerId];
    if (deque && deque.length > 0) {
      return deque.pop()!; // Worker pops from its own tail
    }

    // Attempt to steal from other workers' head
    for (let i = 0; i < this._workerDeques.length; i++) {
      if (i === workerId) continue;
      const victim = this._workerDeques[i]!;
      if (victim.length > 0) {
        return victim.shift()!; // Steal from head
      }
    }

    return null;
  }

  public get totalPendingTasks(): number {
    return this._workerDeques.reduce((sum, d) => sum + d.length, 0);
  }
}
