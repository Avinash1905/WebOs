/**
 * @file MLFQScheduler.ts
 * @description Multi-Level Feedback Queue (MLFQ) dynamic scheduling engine.
 */

export interface MLFQLevel {
  readonly level: number;
  readonly timeQuantumMs: number;
  readonly queue: number[]; // PIDs
}

export class MLFQScheduler {
  private readonly levels: MLFQLevel[];
  private readonly pidLevel = new Map<number, number>(); // PID -> level index
  private readonly pidTimeSpent = new Map<number, number>(); // PID -> ms consumed in current slice

  constructor(levelQuantums: number[] = [20, 40, 80, 160]) {
    this.levels = levelQuantums.map((quantum, idx) => ({
      level: idx,
      timeQuantumMs: quantum,
      queue: []
    }));
  }

  public enqueue(pid: number): void {
    const level = this.pidLevel.get(pid) ?? 0;
    const lvl = this.levels[level];
    if (lvl) lvl.queue.push(pid);
    this.pidLevel.set(pid, level);
  }

  public selectNext(): { pid: number; level: number; quantumMs: number } | undefined {
    for (const lvl of this.levels) {
      if (lvl.queue.length > 0) {
        const pid = lvl.queue.shift()!;
        return { pid, level: lvl.level, quantumMs: lvl.timeQuantumMs };
      }
    }
    return undefined;
  }

  public updateConsumption(pid: number, msUsed: number): void {
    const currentLevel = this.pidLevel.get(pid) ?? 0;
    const lvl = this.levels[currentLevel];
    const quantum = lvl ? lvl.timeQuantumMs : 20;
    const spent = (this.pidTimeSpent.get(pid) ?? 0) + msUsed;

    if (spent >= quantum) {
      // Demote to next lower priority level if not at bottom
      const nextLevel = Math.min(this.levels.length - 1, currentLevel + 1);
      this.pidLevel.set(pid, nextLevel);
      this.pidTimeSpent.set(pid, 0);
    } else {
      this.pidTimeSpent.set(pid, spent);
    }
  }

  public boostAll(): void {
    // Periodic priority boost to prevent starvation
    for (let i = 1; i < this.levels.length; i++) {
      const lvlI = this.levels[i];
      const lvl0 = this.levels[0];
      if (!lvlI || !lvl0) continue;
      while (lvlI.queue.length > 0) {
        const pid = lvlI.queue.shift()!;
        lvl0.queue.push(pid);
        this.pidLevel.set(pid, 0);
        this.pidTimeSpent.set(pid, 0);
      }
    }
  }

  public remove(pid: number): void {
    this.pidLevel.delete(pid);
    this.pidTimeSpent.delete(pid);
    for (const lvl of this.levels) {
      const idx = lvl.queue.indexOf(pid);
      if (idx !== -1) {
        lvl.queue.splice(idx, 1);
      }
    }
  }

  public getLevels(): readonly MLFQLevel[] {
    return this.levels;
  }
}
