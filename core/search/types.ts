/**
 * @file types.ts
 * @description Type definitions for the WebOS VFS Search Engine.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import type { StorageEngine } from '../storage/index.js';

export type SearchSortBy = 'name' | 'path' | 'size' | 'modified' | 'relevance';
export type SearchSortOrder = 'asc' | 'desc';

export interface SearchOptions {
  /** Query substring or glob pattern */
  readonly query: string;
  /** Root directory to scope the search (default: '/') */
  readonly rootPath?: string;
  /** Filter by node types: 'file', 'directory', or both */
  readonly fileTypes?: readonly ('file' | 'directory')[];
  /** Filter by file extensions (e.g. ['txt', 'md'] or ['.txt', '.md']) */
  readonly extensions?: readonly string[];
  /** Include files in results (default: true) */
  readonly includeFiles?: boolean;
  /** Include directories in results (default: true) */
  readonly includeDirectories?: boolean;
  /** Case sensitive search (default: false) */
  readonly caseSensitive?: boolean;
  /** Exact match on name (default: false) */
  readonly exactMatch?: boolean;
  /** Maximum number of results to return (default: 100) */
  readonly maxResults?: number;
  /** Sort results by field (default: 'relevance') */
  readonly sortBy?: SearchSortBy;
  /** Sort order (default: 'desc' for relevance, 'asc' for others) */
  readonly sortOrder?: SearchSortOrder;
  /** Security context for permission-aware filtering */
  readonly context?: Partial<SecurityContext>;
}

export interface SearchResultItem {
  readonly path: string;
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly size: number;
  readonly mimeType?: string;
  readonly updatedAt: number;
  readonly score: number;
  readonly matches?: readonly string[];
}

export interface SearchResult {
  readonly query: string;
  readonly total: number;
  readonly items: readonly SearchResultItem[];
  readonly durationMs: number;
  readonly rootPath: string;
}

export interface SearchIndexEntry {
  readonly path: string;
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly size: number;
  readonly mimeType?: string;
  readonly extension?: string;
  readonly ownerId?: string;
  readonly mode: number;
  readonly updatedAt: number;
  readonly tokens: readonly string[];
}

export interface SearchEngineConfig {
  readonly fileSystem?: FileSystem;
  readonly eventBus?: EventBus;
  readonly permissionManager?: PermissionManager;
  readonly storage?: StorageEngine;
  readonly maxCacheSize?: number;
  readonly cacheTtlMs?: number;
}
