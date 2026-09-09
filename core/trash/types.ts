/**
 * @file types.ts
 * @description Type definitions for the WebOS Trash & Recovery Subsystem.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { FileMetadata, FileSystemNodeType } from '../filesystem/types.js';
import type { StorageEngine } from '../storage/index.js';

/**
 * Record representing an item stored in the Trash system.
 */
export interface TrashEntry {
  /** Unique trash entry ID */
  readonly trashId: string;
  /** Original absolute path before deletion */
  readonly originalPath: string;
  /** Original filename or directory name */
  readonly originalName: string;
  /** Node type ('file' or 'directory') */
  readonly nodeType: FileSystemNodeType;
  /** Timestamp when deleted to trash */
  readonly deletedAt: number;
  /** User ID who deleted the item */
  readonly deletedBy: string;
  /** Size in bytes */
  readonly size: number;
  /** Preserved node metadata */
  readonly metadata: Readonly<FileMetadata>;
  /** Key where file content is stored */
  readonly contentKey?: string;
}

/**
 * Summary metrics for the trash repository.
 */
export interface TrashStats {
  readonly totalItems: number;
  readonly totalBytes: number;
  readonly oldestItemTimestamp?: number;
}

/**
 * Options for restoring a trashed item.
 */
export interface RestoreOptions {
  /** Custom destination path if different from original path */
  readonly destinationPath?: string;
  /** Whether to overwrite if target already exists */
  readonly overwrite?: boolean;
}

/**
 * Configuration options for the TrashManager service.
 */
export interface TrashManagerConfig {
  readonly storage?: StorageEngine;
  readonly eventBus?: EventBus;
  readonly fileSystem?: FileSystem;
  readonly maxTrashSizeBytes?: number;
}
