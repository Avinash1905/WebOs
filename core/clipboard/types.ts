/**
 * @file types.ts
 * @description Type definitions for the WebOS Clipboard System.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { PermissionManager } from '../permissions/index.js';
import type { StorageEngine } from '../storage/index.js';

export type ClipboardDataType = 'text' | 'file' | 'files' | 'directory' | 'custom';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem<T = unknown> {
  readonly id: string;
  readonly type: ClipboardDataType;
  readonly value: T;
  readonly operation: ClipboardOperation;
  readonly sourcePath?: string;
  readonly sourceApp?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SetClipboardOptions {
  operation?: ClipboardOperation;
  sourcePath?: string;
  sourceApp?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface PasteOptions {
  destinationPath?: string;
  overwrite?: boolean;
  targetApp?: string;
}

export interface ClipboardConfig {
  maxHistorySize?: number;
  eventBus?: EventBus;
  fileSystem?: FileSystem;
  permissionManager?: PermissionManager;
  storage?: StorageEngine;
}
