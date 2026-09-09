/**
 * @file ProcessMonitor.ts
 * @description Process resource monitor leveraging ProcessManager APIs.
 */

import type { ProcessManager } from '../process/index.js';
import type { ProcessResourceInfo } from './types.js';

export class ProcessMonitor {
  public static getProcessMetrics(processManager?: ProcessManager): ProcessResourceInfo {
    if (!processManager) {
      return {
        totalProcesses: 0,
        runningProcesses: 0,
        pausedProcesses: 0,
        terminatedProcesses: 0,
        failedProcesses: 0,
        byUser: {},
        byApp: {},
      };
    }

    const stats = processManager.getProcessStats();
    const allProcs = processManager.getProcesses();

    const byUser: Record<string, number> = {};
    const byApp: Record<string, number> = {};

    let failed = 0;
    for (const p of allProcs) {
      if (p.userId) {
        byUser[p.userId] = (byUser[p.userId] ?? 0) + 1;
      }
      if (p.applicationId) {
        byApp[p.applicationId] = (byApp[p.applicationId] ?? 0) + 1;
      }
      if (p.state === 'FAILED') {
        failed++;
      }
    }

    return {
      totalProcesses: stats.totalProcesses,
      runningProcesses: stats.runningProcesses,
      pausedProcesses: stats.pausedProcesses,
      terminatedProcesses: stats.terminatedProcesses,
      failedProcesses: failed,
      byUser,
      byApp,
    };
  }
}
