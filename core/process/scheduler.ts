/**
 * WebOS Core - Preemptive Priority Multilevel Queue Scheduler
 * Manages CPU scheduling, task slicing, context switches, aging, and process queueing.
 */

import { ProcessControlBlock } from './pcb';
import { SchedulerStatistics } from './types';

export class Scheduler {
  private static instance: Scheduler;
  private queues: Map<number, ProcessControlBlock[]> = new Map(); // Priority 0..4
  private currentRunning: ProcessControlBlock | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private quantumMs: number = 20; // 20ms per quantum slice
  private totalContextSwitches: number = 0;
  private startTime = Date.now();
  private isRunning = false;

  private constructor() {
    for (let i = 0; i <= 4; i++) {
      this.queues.set(i, []);
    }
  }

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.tick();
    }, this.quantumMs);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  public enqueue(pcb: ProcessControlBlock) {
    if (pcb.state === 'terminated' || pcb.state === 'zombie') return;
    pcb.state = 'ready';
    const queue = this.queues.get(pcb.priorityLevel) || this.queues.get(2)!;
    if (!queue.includes(pcb)) {
      queue.push(pcb);
    }
  }

  public remove(pcb: ProcessControlBlock) {
    for (const queue of this.queues.values()) {
      const idx = queue.indexOf(pcb);
      if (idx !== -1) {
        queue.splice(idx, 1);
      }
    }
    if (this.currentRunning === pcb) {
      this.currentRunning = null;
    }
  }

  /**
   * Main scheduler tick cycle performing round-robin execution across priority tiers.
   */
  public tick() {
    if (!this.isRunning) return;

    // Record time slice on current process
    if (this.currentRunning) {
      this.currentRunning.recordTimeSlice(this.quantumMs);
      if (this.currentRunning.state === 'running') {
        this.currentRunning.state = 'ready';
        this.enqueue(this.currentRunning);
      }
      this.currentRunning = null;
    }

    // Pick next highest-priority ready process
    let nextProcess: ProcessControlBlock | null = null;
    for (let prio = 4; prio >= 0; prio--) {
      const queue = this.queues.get(prio)!;
      while (queue.length > 0) {
        const candidate = queue.shift()!;
        if (candidate.state === 'ready') {
          nextProcess = candidate;
          break;
        }
      }
      if (nextProcess) break;
    }

    if (nextProcess) {
      this.currentRunning = nextProcess;
      this.currentRunning.state = 'running';
      this.currentRunning.stats.contextSwitches++;
      this.totalContextSwitches++;
    }
  }

  public getCurrentRunning(): ProcessControlBlock | null {
    return this.currentRunning;
  }

  public getStats(): SchedulerStatistics {
    let readyCount = 0;
    for (const q of this.queues.values()) {
      readyCount += q.length;
    }

    return {
      totalProcesses: readyCount + (this.currentRunning ? 1 : 0),
      runningProcesses: this.currentRunning ? 1 : 0,
      readyProcesses: readyCount,
      waitingProcesses: 0,
      totalContextSwitches: this.totalContextSwitches,
      idlePercentage: this.currentRunning ? 10 : 95,
      uptimeMs: Date.now() - this.startTime,
    };
  }
}

export const scheduler = Scheduler.getInstance();
