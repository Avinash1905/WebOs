/**
 * @file index.ts
 * @description WebOS Module 4 — Virtual File System (VFS) barrel exports.
 */

// Core FileSystem Engine
export { FileSystem } from './FileSystem.js';

// Node Models
export { DirectoryNode } from './Directory.js';
export { FileNode } from './File.js';
export {
  calculateContentSize,
  createDirectoryMetadata,
  createFileMetadata,
  generateNodeId,
} from './FileMetadata.js';

// Subsystems
export { DirectoryTree } from './DirectoryTree.js';
export { FileSearch } from './FileSearch.js';
export { FileWatcherManager } from './FileWatcher.js';
export { PathResolver } from './PathResolver.js';
export { InodeTable, type InodeDescriptor } from './InodeTable.js';
export { FileLockManager, type FileLock, type FileLockType } from './FileLockManager.js';
export { StreamBuffer } from './StreamBuffer.js';
export { ChunkedIO, type BlockChunk } from './ChunkedIO.js';
export { VFSMountManager, type MountPoint, type MountType } from './VFSMountManager.js';
export { FileSystemIntegrityChecker, type FSCKReport, type FSCKIssue } from './FileSystemIntegrityChecker.js';

// Configuration
export {
  DEFAULT_VFS_DIRECTORIES,
  type FileSystemConfig,
  type ResolvedFileSystemConfig,
  resolveFileSystemConfig,
} from './FileSystemConfig.js';

// Error Hierarchy
export {
  DirectoryAlreadyExistsError,
  DirectoryCycleError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  FileNotFoundError,
  FileSystemError,
  InvalidNameError,
  InvalidPathError,
  IsADirectoryError,
  NotADirectoryError,
  PermissionDeniedError,
  RootOperationError,
  StorageFailureError,
} from './FileSystemError.js';

// Types & Contracts
export type {
  CreateFileOptions,
  DeleteOptions,
  FileContent,
  FileEncoding,
  FileListOptions,
  FileMetadata,
  FileSearchOptions,
  FileSystemNodeType,
  FileWatcherCallback,
  FileWatcherEvent,
} from './types.js';
