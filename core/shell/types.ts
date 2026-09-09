/**
 * @file types.ts
 * @description Types and interfaces for the WebOS Shell / Command Engine.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import type { ProcessManager } from '../process/index.js';
import type { Scheduler } from '../scheduler/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { TrashManager } from '../trash/index.js';
import type { User, UserManager } from '../users/index.js';
import type { Environment } from './Environment.js';
import type { ShellSession } from './ShellSession.js';

export interface ParsedCommandLine {
  readonly command: string;
  readonly args: readonly string[];
  readonly flags: Record<string, boolean | string>;
  readonly raw: string;
}

export interface CommandResult {
  readonly success: boolean;
  readonly output: string;
  readonly error?: string | null;
  readonly exitCode: number;
  readonly executionTimeMs?: number;
}

export interface CommandContext {
  readonly session: ShellSession;
  readonly fileSystem?: FileSystem;
  readonly permissionManager?: PermissionManager;
  readonly userManager?: UserManager;
  readonly processManager?: ProcessManager;
  readonly scheduler?: Scheduler;
  readonly trashManager?: TrashManager;
  readonly eventBus?: EventBus;
  cwd: string;
  readonly env: Environment;
  readonly user?: User | null;
  readonly securityContext: Partial<SecurityContext>;
  readonly stdout: (msg: string) => void;
  readonly stderr: (msg: string) => void;
}

export type CommandHandler = (
  args: readonly string[],
  flags: Record<string, boolean | string>,
  context: CommandContext
) => Promise<CommandResult | string | void> | CommandResult | string | void;

export interface CommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly aliases?: readonly string[];
  readonly requiredPermissions?: readonly string[];
  readonly handler: CommandHandler;
}

export interface ShellSessionConfig {
  readonly sessionId?: string;
  readonly userId?: string;
  readonly initialCwd?: string;
  readonly env?: Record<string, string>;
  readonly maxHistorySize?: number;
}

export interface ShellConfig {
  readonly storage?: StorageEngine;
  readonly eventBus?: EventBus;
  readonly fileSystem?: FileSystem;
  readonly permissionManager?: PermissionManager;
  readonly userManager?: UserManager;
  readonly processManager?: ProcessManager;
  readonly scheduler?: Scheduler;
  readonly trashManager?: TrashManager;
  readonly defaultHistorySize?: number;
}

export type ShellStatus =
  | 'CREATED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR';
