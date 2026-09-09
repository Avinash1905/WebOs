/**
 * @file RealTimeScheduler.ts
 * @description Real-Time FIFO and Round-Robin scheduler policies.
 */

export type RTPolicy = 'SCHED_FIFO' | 'SCHED_RR';

export interface RTTask {
  readonly pid: number;
  readonly rtPriority: number; // 1 to 99 (higher = more urgent)
  readonly policy: RTPolicy;
  readonly timeSliceMs: number;
  remainingSliceMs: number;
}

export class RealTimeScheduler {
  private readonly tasks: RTTask[] = [];

  public addRTTask(pid: number, rtPriority: number, policy: RTPolicy = 'SCHED_RR', timeSliceMs = 20): RTTask {
    const task: RTTask = {
      pid,
      rtPriority: Math.max(1, Math.min(99, rtPriority)),
      policy,
      timeSliceMs,
      remainingSliceMs: timeSliceMs
    };

    this.tasks.push(task);
    this.sortTasks();
    return task;
  }

  public selectNext(): RTTask | undefined {
    return this.tasks[0];
  }

  public recordExecution(pid: number, durationMs: number): { taskDoneSlice: boolean } {
    const task = this.tasks.find(t => t.pid === pid);
    if (!task) return { taskDoneSlice: false };

    if (task.policy === 'SCHED_FIFO') {
      return { taskDoneSlice: false }; // SCHED_FIFO runs until yield/block
    }

    task.remainingSliceMs -= durationMs;
    if (task.remainingSliceMs <= 0) {
      task.remainingSliceMs = task.timeSliceMs;
      // Move to end of its priority tier
      const idx = this.tasks.indexOf(task);
      this.tasks.splice(idx, 1);
      this.tasks.push(task);
      this.sortTasks();
      return { taskDoneSlice: true };
    }

    return { taskDoneSlice: false };
  }

  public removeRTTask(pid: number): boolean {
    const idx = this.tasks.findIndex(t => t.pid === pid);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  private sortTasks(): void {
    // Sort highest priority first
    this.tasks.sort((a, b) => b.rtPriority - a.rtPriority);
  }
}
