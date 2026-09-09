/**
 * @file applications/task-manager/store/taskManagerStore.ts
 * @description Isolated Zustand store for WebOS Task Manager application.
 */

import { create } from 'zustand';
import { TaskManagerService } from '../engine/TaskManagerService.js';
import type {
  TaskManagerState,
  TaskManagerActions,
  ProcessInfo,
} from '../types.js';

export const useTaskManagerStore = create<TaskManagerState & TaskManagerActions>((set, get) => ({
  processes: TaskManagerService.getSystemProcesses(),
  metrics: {
    totalCpuPct: 3.5,
    usedMemoryMb: 185.0,
    totalMemoryMb: 4096,
    processCount: 5,
    appCount: 2,
    uptimeSeconds: 120,
    cpuHistory: [2.1, 3.4, 4.0, 3.1, 2.8, 3.5],
    memoryHistory: [170, 175, 180, 182, 185],
  },
  preferences: {
    refreshIntervalMs: 2000,
    sortBy: 'cpuPct',
    sortDirection: 'desc',
    showOnlyUserProcesses: false,
  },
  selectedPid: null,
  filterQuery: '',
  activeTab: 'processes',
  isDetailsModalOpen: false,
  inspectProcess: null,

  refreshProcesses: () => {
    const rawProc = TaskManagerService.getSystemProcesses();
    const { preferences, filterQuery, metrics } = get();

    let filtered = rawProc;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.appId.toLowerCase().includes(q) ||
          String(p.pid).includes(q) ||
          p.user.toLowerCase().includes(q)
      );
    }

    const { sortBy, sortDirection } = preferences;
    filtered = [...filtered].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA! < valB!) return sortDirection === 'asc' ? -1 : 1;
      if (valA! > valB!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const newMetrics = TaskManagerService.getSystemMetrics(rawProc);
    const updatedCpuHist = [...metrics.cpuHistory, newMetrics.totalCpuPct].slice(-20);
    const updatedMemHist = [...metrics.memoryHistory, newMetrics.usedMemoryMb].slice(-20);

    set({
      processes: filtered,
      metrics: {
        ...newMetrics,
        cpuHistory: updatedCpuHist,
        memoryHistory: updatedMemHist,
      },
    });
  },

  setFilterQuery: (query: string) => {
    set({ filterQuery: query });
    get().refreshProcesses();
  },

  setSort: (column: keyof ProcessInfo) => {
    const { preferences } = get();
    const newDir =
      preferences.sortBy === column && preferences.sortDirection === 'desc' ? 'asc' : 'desc';
    set({
      preferences: {
        ...preferences,
        sortBy: column,
        sortDirection: newDir,
      },
    });
    get().refreshProcesses();
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  selectProcess: (pid: number | null) => set({ selectedPid: pid }),

  openInspectModal: (process: ProcessInfo) =>
    set({ inspectProcess: process, isDetailsModalOpen: true }),

  closeInspectModal: () => set({ inspectProcess: null, isDetailsModalOpen: false }),

  suspendProcess: async (pid: number) => {
    const proc = get().processes.find((p) => p.pid === pid);
    if (proc) {
      await TaskManagerService.suspendProcess(proc);
      get().refreshProcesses();
    }
  },

  resumeProcess: async (pid: number) => {
    const proc = get().processes.find((p) => p.pid === pid);
    if (proc) {
      await TaskManagerService.resumeProcess(proc);
      get().refreshProcesses();
    }
  },

  terminateProcess: async (pid: number) => {
    const proc = get().processes.find((p) => p.pid === pid);
    if (proc) {
      await TaskManagerService.terminateProcess(proc);
      get().refreshProcesses();
    }
  },

  killProcess: async (pid: number) => {
    const proc = get().processes.find((p) => p.pid === pid);
    if (proc) {
      await TaskManagerService.killProcess(proc);
      get().refreshProcesses();
    }
  },
}));
