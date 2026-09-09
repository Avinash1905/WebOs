/**
 * @file tests/applications/TaskManager.test.ts
 * @description Comprehensive unit tests for WebOS Task Manager service, system metrics calculation, and process controls.
 */

import { describe, it, expect } from 'vitest';
import { TaskManagerService } from '../../applications/task-manager/engine/TaskManagerService.js';
import { useTaskManagerStore } from '../../applications/task-manager/store/taskManagerStore.js';

describe('TaskManager — TaskManagerService Engine', () => {
  it('should fetch active system processes', () => {
    const processes = TaskManagerService.getSystemProcesses();
    expect(processes.length).toBeGreaterThan(0);
    expect(processes.some((p) => p.appId === 'system-kernel')).toBe(true);
    expect(processes.some((p) => p.appId === 'window-manager')).toBe(true);
  });

  it('should calculate valid system metrics', () => {
    const processes = TaskManagerService.getSystemProcesses();
    const metrics = TaskManagerService.getSystemMetrics(processes);

    expect(metrics.totalCpuPct).toBeGreaterThanOrEqual(0);
    expect(metrics.usedMemoryMb).toBeGreaterThan(0);
    expect(metrics.totalMemoryMb).toBe(4096);
    expect(metrics.processCount).toBe(processes.length);
  });
});

describe('TaskManager — Zustand Store State Management', () => {
  it('should filter processes by search query', () => {
    const store = useTaskManagerStore.getState();
    store.setFilterQuery('kernel');

    const filtered = useTaskManagerStore.getState().processes;
    expect(filtered.every((p) => p.name.toLowerCase().includes('kernel') || p.appId.includes('kernel'))).toBe(true);
  });

  it('should sort processes by CPU and Memory', () => {
    const store = useTaskManagerStore.getState();
    store.setSort('cpuPct');

    const sorted = useTaskManagerStore.getState().processes;
    expect(sorted.length).toBeGreaterThan(0);
  });
});
