/**
 * @file Shell.ts
 * @description WebOS Shell Service managing sessions, built-in commands, and execution.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/index.js';
import type { PermissionManager } from '../permissions/index.js';
import type { ProcessManager } from '../process/index.js';
import type { Scheduler } from '../scheduler/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { TrashManager } from '../trash/index.js';
import type { UserManager } from '../users/index.js';
import { BUILTIN_COMMANDS } from './BuiltinCommands.js';
import { CommandRegistry } from './CommandRegistry.js';
import { ShellSession } from './ShellSession.js';
import type {
  CommandDefinition,
  CommandResult,
  ShellConfig,
  ShellSessionConfig,
} from './types.js';

export class Shell extends BaseSystemService {
  public override readonly name = 'shell';
  public override readonly dependencies: readonly string[] = [
    'filesystem',
    'users',
    'permissions',
    'process-manager',
  ];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'scheduler',
    'trash',
    'storage',
  ];

  private readonly _registry = new CommandRegistry();
  private readonly _sessions = new Map<string, ShellSession>();
  private _defaultSession: ShellSession | null = null;

  private _storageEngine?: StorageEngine;
  private _eventBus?: EventBus;
  private _fileSystem?: FileSystem;
  private _permissionManager?: PermissionManager;
  private _userManager?: UserManager;
  private _processManager?: ProcessManager;
  private _scheduler?: Scheduler;
  private _trashManager?: TrashManager;

  constructor(config?: ShellConfig) {
    super();

    this._storageEngine = config?.storage;
    this._eventBus = config?.eventBus;
    this._fileSystem = config?.fileSystem;
    this._permissionManager = config?.permissionManager;
    this._userManager = config?.userManager;
    this._processManager = config?.processManager;
    this._scheduler = config?.scheduler;
    this._trashManager = config?.trashManager;

    // Register built-in commands
    for (const cmd of BUILTIN_COMMANDS) {
      this._registry.registerCommand(cmd);
    }
  }

  // =========================================================================
  // Service Attachments
  // =========================================================================

  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
  }

  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  public attachPermissionManager(permissionManager: PermissionManager): void {
    this._permissionManager = permissionManager;
  }

  public attachUserManager(userManager: UserManager): void {
    this._userManager = userManager;
  }

  public attachProcessManager(processManager: ProcessManager): void {
    this._processManager = processManager;
  }

  public attachScheduler(scheduler: Scheduler): void {
    this._scheduler = scheduler;
  }

  public attachTrashManager(trashManager: TrashManager): void {
    this._trashManager = trashManager;
  }

  // Getters for context building
  public getFileSystem(): FileSystem | undefined {
    return this._fileSystem;
  }

  public getPermissionManager(): PermissionManager | undefined {
    return this._permissionManager;
  }

  public getUserManager(): UserManager | undefined {
    return this._userManager;
  }

  public getProcessManager(): ProcessManager | undefined {
    return this._processManager;
  }

  public getScheduler(): Scheduler | undefined {
    return this._scheduler;
  }

  public getTrashManager(): TrashManager | undefined {
    return this._trashManager;
  }

  public getEventBus(): EventBus | undefined {
    return this._eventBus;
  }

  public getRegistry(): CommandRegistry {
    return this._registry;
  }

  // =========================================================================
  // Service Lifecycle Hooks
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    if (this._storageEngine) {
      await this._storageEngine.initialize();
    }
  }

  protected override async onStart(): Promise<void> {
    // Create default root/user session
    const defaultUser = this._userManager?.getCurrentUser();
    this._defaultSession = this.createSession({
      userId: defaultUser?.id ?? 'user',
      initialCwd: defaultUser?.homeDirectory ?? '/home/user',
    });

    if (this._eventBus) {
      this._eventBus.emit('SHELL_STARTED', {
        status: 'RUNNING',
        timestamp: Date.now(),
      });
    }
  }

  protected override async onStop(): Promise<void> {
    this._sessions.clear();
    this._defaultSession = null;

    if (this._eventBus) {
      this._eventBus.emit('SHELL_STOPPED', {
        status: 'STOPPED',
        timestamp: Date.now(),
      });
    }
  }

  protected override async onReset(): Promise<void> {
    this._sessions.clear();
    this._defaultSession = null;
  }

  // =========================================================================
  // Session Management
  // =========================================================================

  public createSession(config?: ShellSessionConfig): ShellSession {
    let initialCwd = config?.initialCwd;
    const userId = config?.userId ?? this._userManager?.getCurrentUser()?.id ?? 'user';

    if (!initialCwd && this._userManager) {
      const user = this._userManager.getUserSync(userId);
      if (user) {
        initialCwd = user.homeDirectory;
      }
    }

    const session = new ShellSession(
      {
        ...config,
        userId,
        initialCwd: initialCwd ?? '/home/user',
      },
      this
    );

    this._sessions.set(session.sessionId, session);

    if (this._eventBus) {
      this._eventBus.emit('SHELL_SESSION_CREATED', {
        sessionId: session.sessionId,
        userId: session.userId,
        cwd: session.getCwd(),
      });
    }

    return session;
  }

  public getSession(sessionId: string): ShellSession | null {
    return this._sessions.get(sessionId) ?? null;
  }

  public getDefaultSession(): ShellSession {
    if (!this._defaultSession) {
      this._defaultSession = this.createSession();
    }
    return this._defaultSession;
  }

  public closeSession(sessionId: string): boolean {
    const session = this._sessions.get(sessionId);
    if (!session) return false;

    this._sessions.delete(sessionId);
    if (this._defaultSession?.sessionId === sessionId) {
      this._defaultSession = null;
    }

    if (this._eventBus) {
      this._eventBus.emit('SHELL_SESSION_CLOSED', {
        sessionId: session.sessionId,
        userId: session.userId,
        cwd: session.getCwd(),
      });
    }

    return true;
  }

  // =========================================================================
  // Command Execution & Custom Registration
  // =========================================================================

  public registerCommand(command: CommandDefinition, allowOverwrite = false): void {
    this._registry.registerCommand(command, allowOverwrite);
  }

  public async executeCommand(
    commandLine: string,
    sessionId?: string
  ): Promise<CommandResult> {
    const session = sessionId ? this.getSession(sessionId) : this.getDefaultSession();
    if (!session) {
      throw new Error(`Session '${sessionId}' not found`);
    }

    return session.execute(commandLine);
  }
}
