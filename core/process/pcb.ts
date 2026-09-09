/**
 * WebOS Core - Process Control Block (PCB)
 * Encapsulates the complete execution context, memory metrics, descriptors, and signals for a process.
 */

import {
  ProcessControlBlockInterface,
  ProcessState,
  ProcessPriority,
  ProcessMemoryStats,
  ProcessExecutionStats,
  Signal,
} from './types';

export class ProcessControlBlock implements ProcessControlBlockInterface {
  public pid: number;
  public ppid: number;
  public name: string;
  public command: string;
  public args: string[];
  public state: ProcessState;
  public priority: ProcessPriority;
  public priorityLevel: number;
  public nice: number;
  public uid: number;
  public gid: number;
  public cwd: string;
  public env: Map<string, string>;
  public openFdIds: Set<number>;
  public childPids: Set<number>;
  public exitCode: number | null;
  public startedAt: number;
  public terminatedAt: number | null;
  public memory: ProcessMemoryStats;
  public stats: ProcessExecutionStats;

  public signalQueue: Signal[] = [];
  public signalHandlers: Map<Signal, (sig: Signal) => void> = new Map();
  public executeFunction?: (proc: ProcessControlBlockInterface) => Promise<number | void>;
  public executionPromise?: Promise<number | void>;
  public abortController: AbortController = new AbortController();

  constructor(
    pid: number,
    ppid: number,
    name: string,
    command: string,
    args: string[] = [],
    env: Record<string, string> = {},
    cwd: string = '/home/user',
    uid: number = 1000,
    gid: number = 1000,
    priority: ProcessPriority = 'normal'
  ) {
    this.pid = pid;
    this.ppid = ppid;
    this.name = name;
    this.command = command;
    this.args = args;
    this.state = 'created';
    this.priority = priority;
    this.priorityLevel = this.mapPriorityToLevel(priority);
    this.nice = 0;
    this.uid = uid;
    this.gid = gid;
    this.cwd = cwd;
    this.env = new Map(Object.entries(env));
    this.openFdIds = new Set([0, 1, 2]); // stdin, stdout, stderr
    this.childPids = new Set();
    this.exitCode = null;
    this.startedAt = Date.now();
    this.terminatedAt = null;

    this.memory = {
      heapUsed: 1024 * (Math.floor(Math.random() * 8) + 4),
      heapTotal: 1024 * 16,
      virtualSize: 1024 * 32,
      residentSetSize: 1024 * 12,
    };

    this.stats = {
      cpuUsagePercent: 0,
      userTimeMs: 0,
      systemTimeMs: 0,
      totalTimeMs: 0,
      contextSwitches: 0,
      cyclesCount: 0,
    };
  }

  public mapPriorityToLevel(priority: ProcessPriority): number {
    switch (priority) {
      case 'idle':
        return 0;
      case 'low':
        return 1;
      case 'normal':
        return 2;
      case 'high':
        return 3;
      case 'realtime':
        return 4;
    }
  }

  public setPriority(priority: ProcessPriority) {
    this.priority = priority;
    this.priorityLevel = this.mapPriorityToLevel(priority);
  }

  public recordTimeSlice(durationMs: number) {
    this.stats.userTimeMs += durationMs;
    this.stats.totalTimeMs += durationMs;
    this.stats.cyclesCount++;
  }

  public terminate(exitCode: number = 0) {
    this.state = 'terminated';
    this.exitCode = exitCode;
    this.terminatedAt = Date.now();
    this.abortController.abort();
  }

  public toJSON() {
    return {
      pid: this.pid,
      ppid: this.ppid,
      name: this.name,
      command: this.command,
      args: this.args,
      state: this.state,
      priority: this.priority,
      priorityLevel: this.priorityLevel,
      nice: this.nice,
      uid: this.uid,
      gid: this.gid,
      cwd: this.cwd,
      exitCode: this.exitCode,
      startedAt: this.startedAt,
      terminatedAt: this.terminatedAt,
      memory: this.memory,
      stats: this.stats,
    };
  }
}
