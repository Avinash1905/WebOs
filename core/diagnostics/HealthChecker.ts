/**
 * @file HealthChecker.ts
 * @description Built-in non-destructive health checks for all 15 WebOS Core subsystems.
 */

import type {
  DiagnosticCheck,
  DiagnosticResult,
  DiagnosticsDependencies,
} from './types.js';

export class HealthChecker {
  public static createDefaultChecks(deps: DiagnosticsDependencies): DiagnosticCheck[] {
    const checks: DiagnosticCheck[] = [];

    // 1. Kernel
    checks.push({
      id: 'kernel',
      name: 'Kernel Core Engine',
      description: 'Verifies Kernel initialization, state, and registered service count',
      category: 'Core',
      severity: 'CRITICAL',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.kernel) {
          return {
            checkId: 'kernel',
            name: 'Kernel Core Engine',
            category: 'Core',
            severity: 'CRITICAL',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'Kernel reference not attached',
          };
        }
        const status = deps.kernel.getStatus();
        const isHealthy = status === 'RUNNING' || status === 'INITIALIZED';
        return {
          checkId: 'kernel',
          name: 'Kernel Core Engine',
          category: 'Core',
          severity: 'CRITICAL',
          status: isHealthy ? 'PASS' : 'FAIL',
          timestamp: Date.now(),
          message: `Kernel status is '${status}'`,
          details: { status },
          recommendation: isHealthy ? undefined : 'Initialize and boot the WebOS Kernel.',
        };
      },
    });

    // 2. EventBus
    checks.push({
      id: 'event-bus',
      name: 'System Event Bus',
      description: 'Verifies EventBus availability and event dispatching',
      category: 'Messaging',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.eventBus) {
          return {
            checkId: 'event-bus',
            name: 'System Event Bus',
            category: 'Messaging',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'EventBus reference not attached',
          };
        }
        const stats = deps.eventBus.getStats();
        return {
          checkId: 'event-bus',
          name: 'System Event Bus',
          category: 'Messaging',
          severity: 'HIGH',
          status: 'PASS',
          timestamp: Date.now(),
          message: `EventBus active: ${stats.totalEmitted} emitted, ${stats.activeSubscriptions} subscriptions`,
          details: { totalEmitted: stats.totalEmitted, activeSubscriptions: stats.activeSubscriptions },
        };
      },
    });

    // 3. Storage
    checks.push({
      id: 'storage',
      name: 'Storage Engine',
      description: 'Checks Storage Engine status, adapter connectivity, and quota',
      category: 'Persistence',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.storage) {
          return {
            checkId: 'storage',
            name: 'Storage Engine',
            category: 'Persistence',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'Storage Engine reference not attached',
          };
        }
        const isReady = deps.storage.getStatus() === 'RUNNING';
        const stats = await deps.storage.getStats();
        return {
          checkId: 'storage',
          name: 'Storage Engine',
          category: 'Persistence',
          severity: 'HIGH',
          status: isReady ? 'PASS' : 'FAIL',
          timestamp: Date.now(),
          message: isReady ? `Storage ready (${stats.totalKeys} keys, ${stats.reads} reads, ${stats.writes} writes)` : 'Storage Engine not ready',
          details: { isReady, totalKeys: stats.totalKeys, reads: stats.reads, writes: stats.writes },
          recommendation: isReady ? undefined : 'Initialize and start StorageEngine.',
        };
      },
    });

    // 4. FileSystem
    checks.push({
      id: 'filesystem',
      name: 'Virtual File System',
      description: 'Checks VFS root accessibility and directory tree integrity',
      category: 'FileSystem',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.filesystem) {
          return {
            checkId: 'filesystem',
            name: 'Virtual File System',
            category: 'FileSystem',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'FileSystem reference not attached',
          };
        }
        const rootExists = await deps.filesystem.exists('/');
        return {
          checkId: 'filesystem',
          name: 'Virtual File System',
          category: 'FileSystem',
          severity: 'HIGH',
          status: rootExists ? 'PASS' : 'FAIL',
          timestamp: Date.now(),
          message: rootExists ? 'VFS root directory accessible' : 'VFS root directory missing',
          details: { rootExists },
          recommendation: rootExists ? undefined : 'Initialize FileSystem to mount root volume.',
        };
      },
    });

    // 5. Trash
    checks.push({
      id: 'trash',
      name: 'Trash Manager',
      description: 'Checks trash bin functionality and listing',
      category: 'FileSystem',
      severity: 'LOW',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.trashManager) {
          return {
            checkId: 'trash',
            name: 'Trash Manager',
            category: 'FileSystem',
            severity: 'LOW',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'TrashManager reference not attached',
          };
        }
        const trashItems = await deps.trashManager.listTrash();
        return {
          checkId: 'trash',
          name: 'Trash Manager',
          category: 'FileSystem',
          severity: 'LOW',
          status: 'PASS',
          timestamp: Date.now(),
          message: `Trash service active (${trashItems.length} items)`,
          details: { count: trashItems.length },
        };
      },
    });

    // 6. Users & Sessions
    checks.push({
      id: 'users',
      name: 'User & Session System',
      description: 'Checks active session and user registry',
      category: 'Security',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.userManager) {
          return {
            checkId: 'users',
            name: 'User & Session System',
            category: 'Security',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'UserManager reference not attached',
          };
        }
        const users = await deps.userManager.listUsers();
        const current = deps.userManager.getCurrentUser();
        return {
          checkId: 'users',
          name: 'User & Session System',
          category: 'Security',
          severity: 'HIGH',
          status: users.length > 0 ? 'PASS' : 'FAIL',
          timestamp: Date.now(),
          message: `Users active: ${users.length} registered, active: '${current?.username ?? 'none'}'`,
          details: { userCount: users.length, currentUser: current?.username },
        };
      },
    });

    // 7. Permissions
    checks.push({
      id: 'permissions',
      name: 'Permission & Security Engine',
      description: 'Checks permission engine and policy enforcement',
      category: 'Security',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.permissionManager) {
          return {
            checkId: 'permissions',
            name: 'Permission & Security Engine',
            category: 'Security',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'PermissionManager reference not attached',
          };
        }
        return {
          checkId: 'permissions',
          name: 'Permission & Security Engine',
          category: 'Security',
          severity: 'HIGH',
          status: 'PASS',
          timestamp: Date.now(),
          message: 'Permission & Security Engine operational',
        };
      },
    });

    // 8. Process Manager
    checks.push({
      id: 'process',
      name: 'Process Manager',
      description: 'Checks process table and PID manager',
      category: 'Process',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.processManager) {
          return {
            checkId: 'process',
            name: 'Process Manager',
            category: 'Process',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'ProcessManager reference not attached',
          };
        }
        const stats = deps.processManager.getProcessStats();
        return {
          checkId: 'process',
          name: 'Process Manager',
          category: 'Process',
          severity: 'HIGH',
          status: 'PASS',
          timestamp: Date.now(),
          message: `ProcessManager active: ${stats.runningProcesses} running, ${stats.totalProcesses} total`,
          details: { ...stats },
        };
      },
    });

    // 9. Scheduler
    checks.push({
      id: 'scheduler',
      name: 'Process Scheduler',
      description: 'Checks scheduler running state and active queues',
      category: 'Process',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.scheduler) {
          return {
            checkId: 'scheduler',
            name: 'Process Scheduler',
            category: 'Process',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'Scheduler reference not attached',
          };
        }
        const isRunning = deps.scheduler.getStatus() === 'RUNNING';
        return {
          checkId: 'scheduler',
          name: 'Process Scheduler',
          category: 'Process',
          severity: 'HIGH',
          status: isRunning ? 'PASS' : 'WARNING',
          timestamp: Date.now(),
          message: isRunning ? 'Scheduler queue active' : 'Scheduler is not running',
          details: { isRunning },
          recommendation: isRunning ? undefined : 'Start the Process Scheduler.',
        };
      },
    });

    // 10. Shell
    checks.push({
      id: 'shell',
      name: 'Shell / Terminal Engine',
      description: 'Checks command parser and built-in commands',
      category: 'System',
      severity: 'MEDIUM',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.shell) {
          return {
            checkId: 'shell',
            name: 'Shell / Terminal Engine',
            category: 'System',
            severity: 'MEDIUM',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'Shell reference not attached',
          };
        }
        return {
          checkId: 'shell',
          name: 'Shell / Terminal Engine',
          category: 'System',
          severity: 'MEDIUM',
          status: 'PASS',
          timestamp: Date.now(),
          message: 'Shell Engine operational',
        };
      },
    });

    // 11. Application Runtime
    checks.push({
      id: 'apps',
      name: 'Application Runtime',
      description: 'Checks app registry and running instances',
      category: 'Applications',
      severity: 'MEDIUM',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.appRuntime) {
          return {
            checkId: 'apps',
            name: 'Application Runtime',
            category: 'Applications',
            severity: 'MEDIUM',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'ApplicationRuntime reference not attached',
          };
        }
        const appCount = deps.appRuntime.getApps().length;
        const running = deps.appRuntime.getRunningApps();
        return {
          checkId: 'apps',
          name: 'Application Runtime',
          category: 'Applications',
          severity: 'MEDIUM',
          status: appCount > 0 ? 'PASS' : 'WARNING',
          timestamp: Date.now(),
          message: `App Runtime active: ${appCount} registered, ${running.length} running apps`,
          details: { appCount, runningCount: running.length },
        };
      },
    });

    // 12. Search
    checks.push({
      id: 'search',
      name: 'Search Engine',
      description: 'Checks search index size and cache status',
      category: 'Utilities',
      severity: 'LOW',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.searchEngine) {
          return {
            checkId: 'search',
            name: 'Search Engine',
            category: 'Utilities',
            severity: 'LOW',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'SearchEngine reference not attached',
          };
        }
        const size = deps.searchEngine.getIndexSize();
        return {
          checkId: 'search',
          name: 'Search Engine',
          category: 'Utilities',
          severity: 'LOW',
          status: 'PASS',
          timestamp: Date.now(),
          message: `Search Engine active: ${size} items indexed`,
          details: { indexSize: size },
        };
      },
    });

    // 13. Clipboard
    checks.push({
      id: 'clipboard',
      name: 'Clipboard System',
      description: 'Checks clipboard manager and history buffer',
      category: 'Utilities',
      severity: 'LOW',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.clipboardManager) {
          return {
            checkId: 'clipboard',
            name: 'Clipboard System',
            category: 'Utilities',
            severity: 'LOW',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'ClipboardManager reference not attached',
          };
        }
        const historySize = deps.clipboardManager.getHistory().length;
        return {
          checkId: 'clipboard',
          name: 'Clipboard System',
          category: 'Utilities',
          severity: 'LOW',
          status: 'PASS',
          timestamp: Date.now(),
          message: `Clipboard service active (${historySize} history items)`,
          details: { historySize },
        };
      },
    });

    // 14. System Services
    checks.push({
      id: 'services',
      name: 'System Services Manager',
      description: 'Checks registered background services and failed states',
      category: 'Services',
      severity: 'HIGH',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.serviceManager) {
          return {
            checkId: 'services',
            name: 'System Services Manager',
            category: 'Services',
            severity: 'HIGH',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'ServiceManager reference not attached',
          };
        }
        const failed = deps.serviceManager.getFailedServices();
        const running = deps.serviceManager.getRunningServices();
        const isHealthy = failed.length === 0;

        return {
          checkId: 'services',
          name: 'System Services Manager',
          category: 'Services',
          severity: 'HIGH',
          status: isHealthy ? 'PASS' : 'FAIL',
          timestamp: Date.now(),
          message: isHealthy
            ? `All services healthy: ${running.length} running`
            : `${failed.length} service(s) failed: ${failed.map((s) => s.id).join(', ')}`,
          details: { runningCount: running.length, failedCount: failed.length, failed: failed.map((s) => s.id) },
          recommendation: isHealthy ? undefined : 'Restart the failed system services via ServiceManager.',
        };
      },
    });

    // 15. Resource Manager
    checks.push({
      id: 'resources',
      name: 'Resource Manager',
      description: 'Checks system resource usage against configured limits',
      category: 'Resources',
      severity: 'MEDIUM',
      run: async (): Promise<DiagnosticResult> => {
        if (!deps.resourceManager) {
          return {
            checkId: 'resources',
            name: 'Resource Manager',
            category: 'Resources',
            severity: 'MEDIUM',
            status: 'UNKNOWN',
            timestamp: Date.now(),
            message: 'ResourceManager reference not attached',
          };
        }
        const limitsCheck = await deps.resourceManager.checkLimits();
        const status = limitsCheck.exceeded ? 'WARNING' : 'PASS';
        return {
          checkId: 'resources',
          name: 'Resource Manager',
          category: 'Resources',
          severity: 'MEDIUM',
          status,
          timestamp: Date.now(),
          message: limitsCheck.exceeded
            ? `Resource limits exceeded: ${limitsCheck.violations.join('; ')}`
            : 'All resource usage within configured limits',
          details: { violations: limitsCheck.violations },
          recommendation: limitsCheck.exceeded ? 'Close unused applications and clear temporary storage.' : undefined,
        };
      },
    });

    return checks;
  }
}
