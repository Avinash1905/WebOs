/**
 * @file Directory.ts
 * @description Directory node representation for WebOS VFS.
 */

import type { FileMetadata } from './types.js';

/**
 * Represents a directory node in the Virtual File System.
 */
export class DirectoryNode {
  public readonly metadata: FileMetadata;

  constructor(metadata: FileMetadata) {
    this.metadata = metadata;
  }

  public get id(): string {
    return this.metadata.id;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get path(): string {
    return this.metadata.path;
  }

  public get updatedAt(): number {
    return this.metadata.updatedAt;
  }

  public get createdAt(): number {
    return this.metadata.createdAt;
  }

  public get isRoot(): boolean {
    return this.metadata.path === '/';
  }

  public get isHidden(): boolean {
    return this.metadata.hidden ?? false;
  }
}
