/**
 * @file FileMetadata.ts
 * @description Metadata models and creation helpers for WebOS VFS nodes.
 */

import { PathResolver } from './PathResolver.js';
import type { CreateFileOptions, FileMetadata } from './types.js';

let nodeIdCounter = 0;

/**
 * Generates a unique node ID for a filesystem item.
 */
export function generateNodeId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `node_${Date.now()}_${++nodeIdCounter}_${rand}`;
}

/**
 * Calculates accurate byte length for file content.
 */
export function calculateContentSize(content: unknown): number {
  if (content === undefined || content === null) {
    return 0;
  }
  if (typeof content === 'string') {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(content).length;
    }
    // Fallback UTF-8 byte length calculation
    let bytes = 0;
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i);
      if (code < 0x80) bytes += 1;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff) {
        bytes += 4;
        i++;
      } else bytes += 3;
    }
    return bytes;
  }
  if (content instanceof Uint8Array) {
    return content.byteLength;
  }
  if (content instanceof ArrayBuffer) {
    return content.byteLength;
  }
  if (typeof content === 'object') {
    const jsonStr = JSON.stringify(content);
    return calculateContentSize(jsonStr);
  }
  return 0;
}

/**
 * Creates a FileMetadata object for a file node.
 */
export function createFileMetadata(
  path: string,
  parentId: string | null,
  options?: CreateFileOptions,
  customId?: string
): FileMetadata {
  const normalizedPath = PathResolver.normalize(path);
  const name = PathResolver.basename(normalizedPath);
  const now = Date.now();
  const ext = PathResolver.extname(name);
  const mimeType = options?.mimeType ?? PathResolver.getMimeType(name);
  const size = calculateContentSize(options?.content);

  return {
    id: customId ?? generateNodeId(),
    name,
    path: normalizedPath,
    type: 'file',
    parentId,
    createdAt: now,
    updatedAt: now,
    size,
    mimeType,
    extension: ext || undefined,
    hidden: name.startsWith('.'),
    readonly: false,
    customMetadata: options?.customMetadata,
  };
}

/**
 * Creates a FileMetadata object for a directory node.
 */
export function createDirectoryMetadata(
  path: string,
  parentId: string | null,
  customId?: string
): FileMetadata {
  const normalizedPath = PathResolver.normalize(path);
  const name = PathResolver.isRoot(normalizedPath) ? '/' : PathResolver.basename(normalizedPath);
  const now = Date.now();

  return {
    id: customId ?? (PathResolver.isRoot(normalizedPath) ? 'root_dir' : generateNodeId()),
    name,
    path: normalizedPath,
    type: 'directory',
    parentId,
    createdAt: now,
    updatedAt: now,
    size: 0,
    mimeType: 'inode/directory',
    hidden: name.startsWith('.') && name !== '/',
    readonly: PathResolver.isRoot(normalizedPath),
  };
}
