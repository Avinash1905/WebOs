/**
 * @file applications/task-manager/engine/TaskManagerService.ts
 * @description Integration engine connecting Task Manager to Member 2's Process Manager, Window Manager, and Core Kernel.
 */

import { useWindowStore } from '../../../src/stores/windowStore.js';
import { platform } from '../../../src/services/webosPlatform.js';
import type { ProcessInfo, SystemPerformanceMetrics } from '../types.js';

export class TaskManagerService {
  private static startTime = Date.now();

  public static getSystemProcesses(): ProcessInfo[] {
    const windows = useWindowStore.getState().windows;
    const now = Date.now();

    const systemDaemons: ProcessInfo[] = [
      {
        pid: 101,
        name: 'WebOS Kernel Core',
        appId: 'system-kernel',
        user: 'root',
        state: 'running',
        cpuPct: 0.8,
        memoryMb: 42.5,
        startTime: TaskManagerService.startTime,
        priority: 'high',
        permissions: ['SYSTEM_ALL', 'KERNEL_EXEC'],
        windowId: null,
        uptimeSeconds: Math.floor((now - TaskManagerService.startTime) / 1000),
        threads: 8,
        description: 'Primary OS kernel scheduler and event dispatcher daemon.',
      },
      {
        pid: 102,
        name: 'Window Compositor',
        appId: 'window-manager',
        user: 'root',
        state: 'running',
        cpuPct: 1.5,
        memoryMb: 36.2,
        startTime: TaskManagerService.startTime,
        priority: 'high',
        permissions: ['WM_RENDER', 'DISPLAY_CONTROL'],
        windowId: null,
        uptimeSeconds: Math.floor((now - TaskManagerService.startTime) / 1000),
        threads: 4,
        description: 'Desktop shell window composition engine.',
      },
      {
        pid: 103,
        name: 'VFS Storage Engine',
        appId: 'storage-service',
        user: 'system',
        state: 'running',
        cpuPct: 0.2,
        memoryMb: 18.0,
        startTime: TaskManagerService.startTime,
        priority: 'normal',
        permissions: ['FILESYSTEM_READ', 'FILESYSTEM_WRITE'],
        windowId: null,
        uptimeSeconds: Math.floor((now - TaskManagerService.startTime) / 1000),
        threads: 2,
        description: 'Virtual File System persistence and cache server.',
      },
    ];

    const windowProcesses: ProcessInfo[] = windows.map((w, idx) => {
      const pid = 200 + idx;
      const isMinimized = w.state === 'minimized';

      return {
        pid,
        name: w.title || w.appId || 'Application Window',
        appId: w.appId || 'webos-app',
        user: 'user',
        state: isMinimized ? 'suspended' : 'running',
        cpuPct: isMinimized ? 0.0 : Number((1.2 + (idx * 0.7) % 4).toFixed(1)),
        memoryMb: Number((24 + (idx * 12) % 60).toFixed(1)),
        startTime: now - 300000 - idx * 60000,
        priority: 'normal',
        permissions: ['APP_EXEC', 'STORAGE_ACCESS'],
        windowId: w.id,
        uptimeSeconds: Math.floor((now - (now - 300000 - idx * 60000)) / 1000),
        threads: 2,
        description: `Active instance of ${w.title || w.appId}.`,
      };
    });

    return [...systemDaemons, ...windowProcesses];
  }

  public static getSystemMetrics(processes: ProcessInfo[]): SystemPerformanceMetrics {
    const totalCpuPct = Number(
      processes.reduce((acc, p) => acc + (p.state === 'running' ? p.cpuPct : 0), 0).toFixed(1)
    );
    const usedMemoryMb = Number(
      processes.reduce((acc, p) => acc + p.memoryMb, 0).toFixed(1)
    );
    const totalMemoryMb = 4096; // 4 GB Simulated Virtual Memory pool
    const processCount = processes.length;
    const appCount = processes.filter((p) => p.windowId !== null).length;
    const uptimeSeconds = Math.floor((Date.now() - TaskManagerService.startTime) / 1000);

    return {
      totalCpuPct,
      usedMemoryMb,
      totalMemoryMb,
      processCount,
      appCount,
      uptimeSeconds,
      cpuHistory: [],
      memoryHistory: [],
    };
  }

  public static async suspendProcess(process: ProcessInfo): Promise<void> {
    if (process.windowId) {
      useWindowStore.getState().minimizeWindow(process.windowId);
    }
  }

  public static async resumeProcess(process: ProcessInfo): Promise<void> {
    if (process.windowId) {
      useWindowStore.getState().restoreWindow(process.windowId);
      useWindowStore.getState().focusWindow(process.windowId);
    }
  }

  public static async terminateProcess(process: ProcessInfo): Promise<void> {
    if (process.windowId) {
      useWindowStore.getState().closeWindow(process.windowId);
    }
  }

  public static async killProcess(process: ProcessInfo): Promise<void> {
    if (process.windowId) {
      useWindowStore.getState().closeWindow(process.windowId);
    }
  }
}
