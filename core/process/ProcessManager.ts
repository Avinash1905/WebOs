/**
 * @file ProcessManager.ts
 * @description Central Process Management service for WebOS.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import { RoleManager } from '../users/RoleManager.js';
import type { UserManager } from '../users/UserManager.js';
import { PidManager } from './PidManager.js';
import {
  ProcessNotFoundError,
  ProcessPermissionError,
} from './ProcessError.js';
import { ProcessStateTracker } from './ProcessStateTracker.js';
import type {
  CreateProcessOptions,
  Process,
  ProcessFilter,
  ProcessManagerConfig,
  ProcessStats,
  ProcessTreeNode,
  TerminateProcessOptions,
} from './types.js';

let processIdCounter = 0;

function generateProcessUuid(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `proc_${Date.now()}_${++processIdCounter}_${rand}`;
}

/**
 * WebOS Process Manager coordinating application lifecycles, PIDs, process hierarchies,
 * and user security boundaries.
 */
export class ProcessManager extends BaseSystemService {
  public override readonly name = 'process-manager';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'users',
    'permissions',
    'filesystem',
  ];

  private readonly _processes = new Map<number, Process>(); // PID -> Process
  private readonly _pidManager: PidManager;

  private _eventBus?: EventBus;
  private _userManager?: UserManager;
  private _permissionManager?: PermissionManager;
  private _fileSystem?: FileSystem;

  constructor(config?: ProcessManagerConfig) {
    super();
    this._pidManager = new PidManager(config?.startPid ?? 100);
    this._eventBus = config?.eventBus;
    this._userManager = config?.userManager;
    this._permissionManager = config?.permissionManager;
    this._fileSystem = config?.fileSystem;
  }

  /**
   * Attaches an EventBus instance.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  /**
   * Attaches a UserManager instance.
   */
  public attachUserManager(userManager: UserManager): void {
    this._userManager = userManager;
  }

  /**
   * Attaches a PermissionManager instance.
   */
  public attachPermissionManager(permissionManager: PermissionManager): void {
    this._permissionManager = permissionManager;
  }

  /**
   * Attaches a FileSystem instance.
   */
  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  // =========================================================================
  // Service Lifecycle
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    this._processes.clear();
    this._pidManager.reset();
  }

  protected override async onStop(): Promise<void> {
    // Terminate all running processes gracefully
    for (const process of this._processes.values()) {
      if (process.state === 'RUNNING' || process.state === 'PAUSED') {
        await this.terminateProcess(
          process.pid,
          {
            reason: 'System Shutdown',
            terminateChildren: false,
          },
          { userId: 'system', role: 'ADMIN', isSystem: true }
        );
      }
    }
  }

  // =========================================================================
  // Permission & Security Assertion
  // =========================================================================

  private _resolveContext(context?: Partial<SecurityContext>): SecurityContext {
    if (context?.isSystem) {
      return { userId: context.userId ?? 'system', role: 'ADMIN', isSystem: true };
    }

    if (context?.userId) {
      let role = context.role;
      if (!role && this._userManager) {
        const user = this._userManager.getUserSync(context.userId);
        if (user) role = user.role;
      }
      return {
        userId: context.userId,
        role: role ?? (context.userId === 'admin' || context.userId === 'root' ? 'ADMIN' : 'USER'),
        isSystem: false,
      };
    }

    if (this._userManager) {
      const currentUser = this._userManager.getCurrentUser();
      if (currentUser) {
        return {
          userId: currentUser.id,
          role: currentUser.role,
          isSystem: currentUser.role === 'ADMIN',
        };
      }
    }

    return {
      userId: 'system',
      role: 'ADMIN',
      isSystem: true,
    };
  }

  private _assertProcessAccess(
    process: Process,
    action: string,
    context?: Partial<SecurityContext>
  ): void {
    const resolved = this._resolveContext(context);

    // Internal system or Admin has global access
    if (resolved.isSystem || RoleManager.isAdmin(resolved.role)) {
      return;
    }

    // Process owner has access to own processes
    if (process.userId === resolved.userId) {
      return;
    }

    throw new ProcessPermissionError(process.pid, resolved.userId, action);
  }

  // =========================================================================
  // Process Lifecycle Operations
  // =========================================================================

  /**
   * Creates a new process descriptor.
   */
  public async createProcess(
    options: CreateProcessOptions,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const resolvedContext = this._resolveContext(context);
    const pid = this._pidManager.allocate();
    const id = generateProcessUuid();
    const now = Date.now();

    const userId = options.userId ?? resolvedContext.userId;
    const applicationId =
      options.applicationId ?? `app.webos.${options.name.toLowerCase().replace(/\s+/g, '')}`;

    // Resolve working directory
    let cwd = options.cwd ?? '/';
    if (!options.cwd && this._userManager) {
      const user = this._userManager.getUserSync(userId);
      if (user) {
        cwd = user.homeDirectory;
      }
    }

    if (this._fileSystem && this._permissionManager) {
      // Best-effort check if directory access is permitted
      try {
        await this._permissionManager.checkPermission(
          resolvedContext,
          { path: cwd, isDirectory: true },
          'READ'
        );
      } catch {
        // Fallback cwd if needed
      }
    }

    const standardEnv: Record<string, string> = {
      USER: userId,
      HOME: cwd,
      PATH: '/bin:/usr/bin',
      ...(options.env ?? {}),
    };

    let initialProcess: Process = {
      pid,
      id,
      name: options.name,
      applicationId,
      userId,
      parentPid: options.parentPid,
      state: 'CREATED',
      priority: options.priority ?? 'NORMAL',
      createdAt: now,
      cwd,
      env: Object.freeze(standardEnv),
      metadata: Object.freeze({ ...(options.metadata ?? {}) }),
    };

    this._processes.set(pid, initialProcess);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_CREATED', {
        pid,
        name: initialProcess.name,
        parentPid: initialProcess.parentPid,
      });
    }

    if (options.autoStart) {
      initialProcess = await this.startProcess(pid, context ?? { userId: initialProcess.userId });
    }

    return initialProcess;
  }

  /**
   * Starts a process (transitions to RUNNING state).
   */
  public async startProcess(
    pid: number,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const process = this._processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    this._assertProcessAccess(process, 'start', context);
    ProcessStateTracker.validateTransition(pid, process.state, 'RUNNING');

    const now = Date.now();
    const updated: Process = {
      ...process,
      state: 'RUNNING',
      startedAt: process.startedAt ?? now,
    };

    this._processes.set(pid, updated);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_STARTED', {
        pid,
        name: updated.name,
        startedAt: now,
      });
    }

    return updated;
  }

  /**
   * Pauses a running process.
   */
  public async pauseProcess(
    pid: number,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const process = this._processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    this._assertProcessAccess(process, 'pause', context);
    ProcessStateTracker.validateTransition(pid, process.state, 'PAUSED');

    const updated: Process = {
      ...process,
      state: 'PAUSED',
    };

    this._processes.set(pid, updated);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_PAUSED', {
        pid,
        name: updated.name,
      });
    }

    return updated;
  }

  /**
   * Resumes a paused process.
   */
  public async resumeProcess(
    pid: number,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const process = this._processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    this._assertProcessAccess(process, 'resume', context);
    ProcessStateTracker.validateTransition(pid, process.state, 'RUNNING');

    const updated: Process = {
      ...process,
      state: 'RUNNING',
    };

    this._processes.set(pid, updated);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_RESUMED', {
        pid,
        name: updated.name,
      });
    }

    return updated;
  }

  /**
   * Terminates a process and optionally its children.
   */
  public async terminateProcess(
    pid: number,
    options?: TerminateProcessOptions,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const process = this._processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    this._assertProcessAccess(process, 'terminate', context);

    // If already terminated, return existing
    if (process.state === 'TERMINATED') {
      return process;
    }

    // 1. Terminate child processes recursively if enabled
    if (options?.terminateChildren !== false) {
      const children = this.getChildProcesses(pid);
      for (const child of children) {
        if (child.state !== 'TERMINATED' && child.state !== 'FAILED') {
          await this.terminateProcess(child.pid, options, context);
        }
      }
    }

    ProcessStateTracker.validateTransition(pid, process.state, 'TERMINATED');

    const now = Date.now();
    const updated: Process = {
      ...process,
      state: 'TERMINATED',
      stoppedAt: now,
      exitCode: options?.exitCode ?? 0,
    };

    this._processes.set(pid, updated);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_STOPPED', {
        pid,
        name: updated.name,
        exitCode: updated.exitCode,
      });

      this._eventBus.emit('PROCESS_TERMINATED', {
        pid,
        name: updated.name,
        reason: options?.reason,
      });
    }

    return updated;
  }

  /**
   * Restarts a process.
   */
  public async restartProcess(
    pid: number,
    context?: Partial<SecurityContext>
  ): Promise<Process> {
    const process = this._processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    this._assertProcessAccess(process, 'restart', context);

    const now = Date.now();
    const updated: Process = {
      ...process,
      state: 'RUNNING',
      startedAt: now,
      stoppedAt: undefined,
      exitCode: undefined,
    };

    this._processes.set(pid, updated);

    if (this._eventBus) {
      this._eventBus.emit('PROCESS_RESTARTED', {
        pid,
        name: updated.name,
      });
    }

    return updated;
  }

  // =========================================================================
  // Process Queries & Tree
  // =========================================================================

  /**
   * Retrieves a process by PID.
   */
  public getProcess(pid: number): Process | null {
    return this._processes.get(pid) ?? null;
  }

  /**
   * Alias for getProcess.
   */
  public getProcessByPid(pid: number): Process | null {
    return this.getProcess(pid);
  }

  /**
   * Returns a list of processes matching optional filters.
   */
  public getProcesses(filter?: ProcessFilter): Process[] {
    let result = Array.from(this._processes.values());

    if (filter?.userId) {
      result = result.filter((p) => p.userId === filter.userId);
    }
    if (filter?.applicationId) {
      result = result.filter((p) => p.applicationId === filter.applicationId);
    }
    if (filter?.state) {
      result = result.filter((p) => p.state === filter.state);
    }
    if (filter?.parentPid !== undefined) {
      result = result.filter((p) => p.parentPid === filter.parentPid);
    }

    return result;
  }

  /**
   * Alias for getProcesses.
   */
  public listProcesses(filter?: ProcessFilter): Process[] {
    return this.getProcesses(filter);
  }

  /**
   * Returns all currently running processes.
   */
  public getRunningProcesses(): Process[] {
    return this.getProcesses({ state: 'RUNNING' });
  }

  /**
   * Returns all direct child processes of a given PID.
   */
  public getChildProcesses(pid: number): Process[] {
    return Array.from(this._processes.values()).filter((p) => p.parentPid === pid);
  }

  /**
   * Returns the parent process of a given PID.
   */
  public getParentProcess(pid: number): Process | null {
    const proc = this._processes.get(pid);
    if (!proc || proc.parentPid === undefined) return null;
    return this._processes.get(proc.parentPid) ?? null;
  }

  /**
   * Generates a hierarchical tree of processes starting from root processes (parentPid undefined).
   */
  public getProcessTree(): ProcessTreeNode[] {
    const buildNode = (process: Process): ProcessTreeNode => {
      const children = this.getChildProcesses(process.pid).map(buildNode);
      return {
        process,
        children,
      };
    };

    const rootProcesses = Array.from(this._processes.values()).filter(
      (p) => p.parentPid === undefined
    );

    return rootProcesses.map(buildNode);
  }

  /**
   * Computes process statistics.
   */
  public getProcessStats(): ProcessStats {
    let running = 0;
    let paused = 0;
    let waiting = 0;
    let terminated = 0;

    const byUser: Record<string, number> = {};
    const byApp: Record<string, number> = {};

    for (const p of this._processes.values()) {
      if (p.state === 'RUNNING') running++;
      else if (p.state === 'PAUSED') paused++;
      else if (p.state === 'WAITING') waiting++;
      else if (p.state === 'TERMINATED' || p.state === 'FAILED') terminated++;

      byUser[p.userId] = (byUser[p.userId] ?? 0) + 1;
      byApp[p.applicationId] = (byApp[p.applicationId] ?? 0) + 1;
    }

    return {
      totalProcesses: this._processes.size,
      runningProcesses: running,
      pausedProcesses: paused,
      waitingProcesses: waiting,
      terminatedProcesses: terminated,
      processesByUser: Object.freeze(byUser),
      processesByApplication: Object.freeze(byApp),
    };
  }
}
