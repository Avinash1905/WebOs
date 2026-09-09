/**
 * @file File.ts
 * @description File node representation for WebOS VFS.
 */

import type { FileMetadata } from './types.js';

/**
 * Represents a file node in the Virtual File System.
 */
export class FileNode {
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

  public get size(): number {
    return this.metadata.size;
  }

  public get mimeType(): string {
    return this.metadata.mimeType;
  }

  public get extension(): string | undefined {
    return this.metadata.extension;
  }

  public get updatedAt(): number {
    return this.metadata.updatedAt;
  }

  public get createdAt(): number {
    return this.metadata.createdAt;
  }

  public get isHidden(): boolean {
    return this.metadata.hidden ?? false;
  }
}
