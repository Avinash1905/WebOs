/**
 * @file applications/task-manager/types.ts
 * @description Type definitions for WebOS Task Manager application.
 */

export type ProcessState = 'created' | 'ready' | 'running' | 'suspended' | 'waiting' | 'terminated';
export type ProcessPriority = 'high' | 'normal' | 'low';

export interface ProcessInfo {
  pid: number;
  name: string;
  appId: string;
  user: string;
  state: ProcessState;
  cpuPct: number;
  memoryMb: number;
  startTime: number;
  priority: ProcessPriority;
  permissions: string[];
  windowId: string | null;
  uptimeSeconds: number;
  threads: number;
  description: string;
}

export interface SystemPerformanceMetrics {
  totalCpuPct: number;
  usedMemoryMb: number;
  totalMemoryMb: number;
  processCount: number;
  appCount: number;
  uptimeSeconds: number;
  cpuHistory: number[];
  memoryHistory: number[];
}

export interface TaskManagerPreferences {
  refreshIntervalMs: number;
  sortBy: keyof ProcessInfo;
  sortDirection: 'asc' | 'desc';
  showOnlyUserProcesses: boolean;
}

export interface TaskManagerState {
  processes: ProcessInfo[];
  metrics: SystemPerformanceMetrics;
  preferences: TaskManagerPreferences;
  selectedPid: number | null;
  filterQuery: string;
  activeTab: 'processes' | 'performance' | 'details';
  isDetailsModalOpen: boolean;
  inspectProcess: ProcessInfo | null;
}

export interface TaskManagerActions {
  refreshProcesses: () => void;
  setFilterQuery: (query: string) => void;
  setSort: (column: keyof ProcessInfo) => void;
  setActiveTab: (tab: 'processes' | 'performance' | 'details') => void;
  selectProcess: (pid: number | null) => void;
  openInspectModal: (process: ProcessInfo) => void;
  closeInspectModal: () => void;
  
  suspendProcess: (pid: number) => Promise<void>;
  resumeProcess: (pid: number) => Promise<void>;
  terminateProcess: (pid: number) => Promise<void>;
  killProcess: (pid: number) => Promise<void>;
}
