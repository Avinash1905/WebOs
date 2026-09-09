/**
 * @file CFSScheduler.ts
 * @description Completely Fair Scheduler (CFS) virtual runtime simulation.
 */

const NICE_TO_WEIGHT: Record<number, number> = {
  [-20]: 88761, [-19]: 71755, [-18]: 56483, [-17]: 46273, [-16]: 36291,
  [-15]: 29154, [-14]: 23254, [-13]: 18705, [-12]: 14949, [-11]: 11916,
  [-10]: 9548,  [-9]: 7620,   [-8]: 6100,   [-7]: 4904,   [-6]: 3903,
  [-5]: 3121,   [-4]: 2501,   [-3]: 1991,   [-2]: 1586,   [-1]: 1277,
  [0]: 1024,    [1]: 820,     [2]: 655,     [3]: 526,     [4]: 423,
  [5]: 335,     [6]: 272,     [7]: 215,     [8]: 172,     [9]: 137,
  [10]: 110,    [11]: 87,     [12]: 70,     [13]: 56,     [14]: 45,
  [15]: 36,     [16]: 29,     [17]: 23,     [18]: 18,     [19]: 15
};

export interface CFSTask {
  readonly pid: number;
  readonly nice: number;
  readonly weight: number;
  vruntime: number;
}

export class CFSScheduler {
  private readonly tasks = new Map<number, CFSTask>();
  private minVRuntime = 0;

  public addTask(pid: number, nice = 0): CFSTask {
    const clampedNice = Math.max(-20, Math.min(19, nice));
    const weight = NICE_TO_WEIGHT[clampedNice] ?? 1024;

    const task: CFSTask = {
      pid,
      nice: clampedNice,
      weight,
      vruntime: this.minVRuntime
    };

    this.tasks.set(pid, task);
    return task;
  }

  public selectNext(): CFSTask | undefined {
    if (this.tasks.size === 0) return undefined;

    let smallest: CFSTask | undefined;
    for (const task of this.tasks.values()) {
      if (!smallest || task.vruntime < smallest.vruntime) {
        smallest = task;
      }
    }

    if (smallest) {
      this.minVRuntime = smallest.vruntime;
    }

    return smallest;
  }

  public recordExecution(pid: number, realTimeMs: number): void {
    const task = this.tasks.get(pid);
    if (!task) return;

    // vruntime += (realTimeMs * NICE_0_LOAD) / weight
    const deltaV = (realTimeMs * 1024) / task.weight;
    task.vruntime += deltaV;

    // Update global minVRuntime
    let min = Infinity;
    for (const t of this.tasks.values()) {
      if (t.vruntime < min) min = t.vruntime;
    }
    this.minVRuntime = min === Infinity ? 0 : min;
  }

  public removeTask(pid: number): void {
    this.tasks.delete(pid);
  }

  public getTask(pid: number): CFSTask | undefined {
    return this.tasks.get(pid);
  }
}
