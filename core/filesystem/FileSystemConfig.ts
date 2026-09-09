/**
 * @file FileSystemConfig.ts
 * @description Configuration options and defaults for WebOS Virtual File System.
 */

import type { EventBus } from '../events/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { FileMetadata } from './types.js';

/**
 * Options for configuring the WebOS Virtual File System.
 */
export interface FileSystemConfig {
  /** StorageEngine instance used for metadata and content persistence */
  readonly storage?: StorageEngine;

  /** EventBus instance used for dispatching filesystem events */
  readonly eventBus?: EventBus;

  /** Initial default directories to create if filesystem is brand new */
  readonly defaultDirectories?: readonly string[];

  /** Case sensitivity policy. Defaults to true. */
  readonly caseSensitive?: boolean;

  /**
   * Optional Trash integration hook called when deleting files.
   * Return true to indicate the item was moved to Trash (skips permanent deletion).
   */
  readonly trashHook?: (path: string, metadata: FileMetadata) => Promise<boolean>;
}

export const DEFAULT_VFS_DIRECTORIES: readonly string[] = [
  '/home',
  '/home/user',
  '/home/user/Desktop',
  '/home/user/Documents',
  '/home/user/Downloads',
  '/home/user/Pictures',
  '/home/user/Music',
  '/applications',
  '/system',
];

export interface ResolvedFileSystemConfig {
  readonly storage?: StorageEngine;
  readonly eventBus?: EventBus;
  readonly defaultDirectories: readonly string[];
  readonly caseSensitive: boolean;
  readonly trashHook?: (path: string, metadata: FileMetadata) => Promise<boolean>;
}

export function resolveFileSystemConfig(
  userConfig?: FileSystemConfig
): ResolvedFileSystemConfig {
  return {
    storage: userConfig?.storage,
    eventBus: userConfig?.eventBus,
    defaultDirectories: userConfig?.defaultDirectories ?? DEFAULT_VFS_DIRECTORIES,
    caseSensitive: userConfig?.caseSensitive ?? true,
    trashHook: userConfig?.trashHook,
  };
}
