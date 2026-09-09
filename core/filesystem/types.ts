/**
 * @file types.ts
 * @description Core types and interfaces for the WebOS Virtual File System (VFS).
 */

/**
 * Type identifier for filesystem nodes.
 */
export type FileSystemNodeType = 'file' | 'directory';

/**
 * Supported file content formats.
 */
export type FileContent = string | Uint8Array | ArrayBuffer | object;

/**
 * Encoding options for reading/writing file contents.
 */
export type FileEncoding = 'utf-8' | 'binary' | 'json';

/**
 * Complete metadata descriptor for a file or directory node in WebOS.
 */
export interface FileMetadata {
  /** Unique UUID / node identifier */
  readonly id: string;
  /** File or folder name (e.g., 'report.txt') */
  readonly name: string;
  /** Full normalized absolute path (e.g., '/home/user/Documents/report.txt') */
  readonly path: string;
  /** Node type: 'file' or 'directory' */
  readonly type: FileSystemNodeType;
  /** ID of parent directory node, or null for root '/' */
  readonly parentId: string | null;
  /** Creation timestamp in milliseconds */
  readonly createdAt: number;
  /** Last update timestamp in milliseconds */
  readonly updatedAt: number;
  /** Size in bytes */
  readonly size: number;
  /** MIME type string (e.g. 'text/plain', 'application/json', 'inode/directory') */
  readonly mimeType: string;
  /** File extension including dot (e.g. '.txt'), if any */
  readonly extension?: string;
  /** Whether the file is hidden */
  readonly hidden?: boolean;
  /** Whether the file is read-only */
  readonly readonly?: boolean;
  /** Optional custom user/application metadata */
  readonly customMetadata?: Readonly<Record<string, unknown>>;
}

/**
 * Options when creating a new file.
 */
export interface CreateFileOptions {
  /** Initial file content */
  readonly content?: FileContent;
  /** Custom MIME type (inferred from extension if omitted) */
  readonly mimeType?: string;
  /** Whether to overwrite an existing file at the path */
  readonly overwrite?: boolean;
  /** Encoding of the content */
  readonly encoding?: FileEncoding;
  /** Optional custom metadata */
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Options when listing files in a directory.
 */
export interface FileListOptions {
  /** If true, recursively lists all descendants */
  readonly recursive?: boolean;
  /** Sort property */
  readonly sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'type';
  /** Sort order */
  readonly sortOrder?: 'asc' | 'desc';
  /** Whether to include hidden files (starting with '.') */
  readonly includeHidden?: boolean;
}

/**
 * Options for file search.
 */
export interface FileSearchOptions {
  /** Search query substring in filename */
  readonly query?: string;
  /** Filter by node type ('file' or 'directory') */
  readonly type?: FileSystemNodeType;
  /** Filter by extension (e.g., '.txt' or 'txt') */
  readonly extension?: string;
  /** Filter by path prefix (e.g., '/home/user/Documents') */
  readonly pathPrefix?: string;
  /** Case-sensitive search. Defaults to false. */
  readonly caseSensitive?: boolean;
  /** Maximum number of search results to return */
  readonly maxResults?: number;
}

/**
 * Event delivered to a file watcher.
 */
export interface FileWatcherEvent {
  /** Type of filesystem change */
  readonly type: 'created' | 'updated' | 'deleted' | 'renamed' | 'moved';
  /** Current path of the affected node */
  readonly path: string;
  /** Previous path if renamed or moved */
  readonly oldPath?: string;
  /** New path if renamed or moved */
  readonly newPath?: string;
  /** Node type */
  readonly nodeType: FileSystemNodeType;
  /** Timestamp when event occurred */
  readonly timestamp: number;
}

/**
 * Callback function for file watcher subscriptions.
 */
export type FileWatcherCallback = (event: FileWatcherEvent) => void | Promise<void>;

/**
 * Options for deleting a node.
 */
export interface DeleteOptions {
  /** If true and target is a non-empty directory, recursively deletes children. Defaults to true. */
  readonly recursive?: boolean;
  /**
   * If true and a trash hook is configured, attempts soft delete to Trash.
   * If false, permanently deletes from storage. Defaults to true.
   */
  readonly useTrash?: boolean;
}
