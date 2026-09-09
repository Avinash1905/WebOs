/**
 * @file DirectoryTree.ts
 * @description In-memory hierarchical directory tree index for fast VFS operations.
 */

import { PathResolver } from './PathResolver.js';
import type { FileMetadata } from './types.js';

/**
 * Manages the in-memory index of all filesystem nodes, paths, and parent-child relations.
 */
export class DirectoryTree {
  private readonly _nodesByPath = new Map<string, FileMetadata>();
  private readonly _nodesById = new Map<string, FileMetadata>();
  private readonly _childrenByParentId = new Map<string, Set<string>>();

  public get size(): number {
    return this._nodesByPath.size;
  }

  /**
   * Adds or updates a node in the tree index.
   */
  public add(metadata: FileMetadata): void {
    const normalizedPath = PathResolver.normalize(metadata.path);
    const existing = this._nodesByPath.get(normalizedPath);

    // If path existed under different ID, remove old node ID mappings
    if (existing && existing.id !== metadata.id) {
      this.removeById(existing.id);
    }

    this._nodesByPath.set(normalizedPath, metadata);
    this._nodesById.set(metadata.id, metadata);

    if (metadata.parentId) {
      if (!this._childrenByParentId.has(metadata.parentId)) {
        this._childrenByParentId.set(metadata.parentId, new Set());
      }
      this._childrenByParentId.get(metadata.parentId)!.add(metadata.id);
    }
  }

  /**
   * Retrieves metadata for a node by its normalized path.
   */
  public get(path: string): FileMetadata | undefined {
    return this._nodesByPath.get(PathResolver.normalize(path));
  }

  /**
   * Retrieves metadata for a node by its unique node ID.
   */
  public getById(id: string): FileMetadata | undefined {
    return this._nodesById.get(id);
  }

  /**
   * Checks whether a node exists at the given path.
   */
  public has(path: string): boolean {
    return this._nodesByPath.has(PathResolver.normalize(path));
  }

  /**
   * Removes a node by its path.
   */
  public remove(path: string): FileMetadata | undefined {
    const node = this.get(path);
    if (!node) {
      return undefined;
    }
    this.removeById(node.id);
    return node;
  }

  /**
   * Removes a node by its ID.
   */
  public removeById(id: string): FileMetadata | undefined {
    const node = this._nodesById.get(id);
    if (!node) {
      return undefined;
    }

    this._nodesByPath.delete(node.path);
    this._nodesById.delete(id);

    if (node.parentId) {
      const parentChildren = this._childrenByParentId.get(node.parentId);
      if (parentChildren) {
        parentChildren.delete(id);
        if (parentChildren.size === 0) {
          this._childrenByParentId.delete(node.parentId);
        }
      }
    }

    this._childrenByParentId.delete(id);
    return node;
  }

  /**
   * Returns metadata for all direct children of the specified parent directory.
   */
  public getChildren(parentPath: string): FileMetadata[] {
    const parent = this.get(parentPath);
    if (!parent) {
      return [];
    }

    const childIds = this._childrenByParentId.get(parent.id);
    if (!childIds || childIds.size === 0) {
      return [];
    }

    const results: FileMetadata[] = [];
    for (const id of childIds) {
      const child = this._nodesById.get(id);
      if (child) {
        results.push(child);
      }
    }

    return results;
  }

  /**
   * Returns metadata for all recursive descendants under the specified path.
   */
  public getDescendants(parentPath: string): FileMetadata[] {
    const parent = this.get(parentPath);
    if (!parent) {
      return [];
    }

    const descendants: FileMetadata[] = [];
    const queue: FileMetadata[] = this.getChildren(parentPath);

    while (queue.length > 0) {
      const current = queue.shift()!;
      descendants.push(current);
      if (current.type === 'directory') {
        const children = this.getChildren(current.path);
        queue.push(...children);
      }
    }

    return descendants;
  }

  /**
   * Returns list of ancestor directories from the parent up to root '/'.
   */
  public getAncestors(path: string): FileMetadata[] {
    const ancestors: FileMetadata[] = [];
    let currentPath = PathResolver.normalize(path);

    while (currentPath !== '/') {
      currentPath = PathResolver.dirname(currentPath);
      const node = this.get(currentPath);
      if (node) {
        ancestors.push(node);
      }
    }

    return ancestors;
  }

  /**
   * Returns the root node metadata.
   */
  public getRoot(): FileMetadata | undefined {
    return this._nodesByPath.get('/');
  }

  /**
   * Returns all indexed nodes in the filesystem.
   */
  public getAllNodes(): FileMetadata[] {
    return Array.from(this._nodesByPath.values());
  }

  /**
   * Clears the entire tree index.
   */
  public clear(): void {
    this._nodesByPath.clear();
    this._nodesById.clear();
    this._childrenByParentId.clear();
  }
}
