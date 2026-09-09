/**
 * WebOS Core - Process Management & Scheduler Types
 */

export type ProcessState =
  | 'created'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'stopped'
  | 'terminated'
  | 'zombie';

export type ProcessPriority =
  | 'idle'     // 0
  | 'low'      // 1
  | 'normal'   // 2
  | 'high'     // 3
  | 'realtime';// 4

export enum Signal {
  SIGHUP = 1,
  SIGINT = 2,
  SIGQUIT = 3,
  SIGILL = 4,
  SIGTRAP = 5,
  SIGABRT = 6,
  SIGBUS = 7,
  SIGFPE = 8,
  SIGKILL = 9,
  SIGUSR1 = 10,
  SIGSEGV = 11,
  SIGUSR2 = 12,
  SIGPIPE = 13,
  SIGALRM = 14,
  SIGTERM = 15,
  SIGCHLD = 17,
  SIGCONT = 18,
  SIGSTOP = 19,
  SIGTSTP = 20,
}

export interface ProcessMemoryStats {
  heapUsed: number;
  heapTotal: number;
  virtualSize: number;
  residentSetSize: number;
}

export interface ProcessExecutionStats {
  cpuUsagePercent: number;
  userTimeMs: number;
  systemTimeMs: number;
  totalTimeMs: number;
  contextSwitches: number;
  cyclesCount: number;
}

export interface ProcessLaunchParams {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  parentPid?: number;
  uid?: number;
  gid?: number;
  priority?: ProcessPriority;
  execute?: (proc: ProcessControlBlockInterface) => Promise<number | void>;
}

export interface ProcessControlBlockInterface {
  pid: number;
  ppid: number;
  name: string;
  command: string;
  args: string[];
  state: ProcessState;
  priority: ProcessPriority;
  priorityLevel: number;
  nice: number;
  uid: number;
  gid: number;
  cwd: string;
  env: Map<string, string>;
  openFdIds: Set<number>;
  childPids: Set<number>;
  exitCode: number | null;
  startedAt: number;
  terminatedAt: number | null;
  memory: ProcessMemoryStats;
  stats: ProcessExecutionStats;
}

export interface SchedulerStatistics {
  totalProcesses: number;
  runningProcesses: number;
  readyProcesses: number;
  waitingProcesses: number;
  totalContextSwitches: number;
  idlePercentage: number;
  uptimeMs: number;
}
