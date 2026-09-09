/**
 * @file types.ts
 * @description Type definitions for the WebOS Application Runtime and Lifecycle Management.
 */

import type { EventBus } from '../events/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { ProcessManager } from '../process/index.js';
import type { UserManager } from '../users/index.js';
import type { PermissionManager } from '../permissions/index.js';
import type { ClipboardManager } from '../clipboard/index.js';

export type AppPermission =
  | 'storage:read'
  | 'storage:write'
  | 'clipboard:read'
  | 'clipboard:write'
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network'
  | 'notifications'
  | 'process:manage'
  | 'system:admin';

export type AppLifecycleState =
  | 'unregistered'
  | 'registered'
  | 'installing'
  | 'installed'
  | 'launching'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'crashed'
  | 'uninstalled';

export type AppEntryFunction = (
  context: IApplicationContext
) => Promise<void | (() => void | Promise<void>)> | void | (() => void | Promise<void>);

export interface ApplicationManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  author?: string;
  main?: AppEntryFunction | string;
  permissions?: AppPermission[];
  multiInstance?: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  category?: string;
  fileExtensions?: string[];
  autoStart?: boolean;
  systemApp?: boolean;
  metadata?: Record<string, any>;
}

export interface IApplicationStorage {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface IApplicationFS {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
}

export interface IApplicationClipboard {
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
}

export interface IApplicationLogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface IApplicationContext {
  readonly appId: string;
  readonly instanceId: string;
  readonly processId: number;
  readonly userId: string;
  readonly manifest: ApplicationManifest;
  readonly storage: IApplicationStorage;
  readonly fs: IApplicationFS;
  readonly clipboard: IApplicationClipboard;
  readonly log: IApplicationLogger;

  getLaunchArgs<T = Record<string, any>>(): T;
  close(): Promise<void>;

  emit(event: string, payload?: any): void;
  on(event: string, handler: (payload: any) => void): () => void;

  onPause(cb: () => void): () => void;
  onResume(cb: () => void): () => void;
  onDestroy(cb: () => void | Promise<void>): () => void;
}

export interface AppInstance {
  readonly instanceId: string;
  readonly appId: string;
  readonly processId: number;
  readonly userId: string;
  state: AppLifecycleState;
  readonly manifest: ApplicationManifest;
  readonly context: IApplicationContext;
  readonly launchedAt: number;
  stoppedAt?: number;
  launchArgs: Record<string, any>;
  cleanupFn?: () => void | Promise<void>;
  pauseCallbacks: (() => void)[];
  resumeCallbacks: (() => void)[];
  destroyCallbacks: (() => void | Promise<void>)[];
}

export interface LaunchOptions {
  userId?: string;
  args?: Record<string, any>;
  windowId?: string;
  env?: Record<string, string>;
  allowMultiple?: boolean;
}

export interface AppFilter {
  category?: string;
  fileExtension?: string;
  systemApp?: boolean;
  search?: string;
}

export interface ApplicationRuntimeDependencies {
  eventBus?: EventBus;
  storage?: StorageEngine;
  filesystem?: FileSystem;
  processManager?: ProcessManager;
  userManager?: UserManager;
  permissionManager?: PermissionManager;
  clipboardManager?: ClipboardManager;
}

export interface ApplicationRuntimeConfig {
  maxConcurrentInstances?: number;
  defaultPermissions?: AppPermission[];
}
