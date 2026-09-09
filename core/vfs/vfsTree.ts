/**
 * WebOS Core - VFS Directory Tree Node
 * Hierarchical tree node representing directory entries mapping names to Inodes.
 */

import { InodeTable } from './inode';
import { VFSNodeType } from './types';
import { Path } from './path';

export interface DirectoryEntry {
  name: string;
  ino: number;
  type: VFSNodeType;
}

export class VFSTreeNode {
  public name: string;
  public ino: number;
  public type: VFSNodeType;
  public parent: VFSTreeNode | null;
  public children: Map<string, VFSTreeNode>;

  constructor(
    name: string,
    ino: number,
    type: VFSNodeType,
    parent: VFSTreeNode | null = null
  ) {
    this.name = name;
    this.ino = ino;
    this.type = type;
    this.parent = parent;
    this.children = new Map();
  }

  public get isDirectory(): boolean {
    return this.type === 'directory';
  }

  public getFullPath(): string {
    if (!this.parent) return '/';
    const parentPath = this.parent.getFullPath();
    return parentPath === '/' ? `/${this.name}` : `${parentPath}/${this.name}`;
  }

  public getChild(name: string): VFSTreeNode | undefined {
    return this.children.get(name);
  }

  public addChild(node: VFSTreeNode): void {
    node.parent = this;
    this.children.set(node.name, node);
  }

  public removeChild(name: string): boolean {
    const child = this.children.get(name);
    if (child) {
      child.parent = null;
      return this.children.delete(name);
    }
    return false;
  }

  public listEntries(): DirectoryEntry[] {
    const entries: DirectoryEntry[] = [];
    // Standard POSIX . and .. entries
    entries.push({ name: '.', ino: this.ino, type: 'directory' });
    entries.push({
      name: '..',
      ino: this.parent ? this.parent.ino : this.ino,
      type: 'directory',
    });

    for (const child of this.children.values()) {
      entries.push({
        name: child.name,
        ino: child.ino,
        type: child.type,
      });
    }

    return entries;
  }
}

export class VFSTree {
  public root: VFSTreeNode;
  private inodeTable: InodeTable;

  constructor(inodeTable: InodeTable) {
    this.inodeTable = inodeTable;
    const rootInode = this.inodeTable.allocate('directory', 0o755, 0, 0);
    this.root = new VFSTreeNode('/', rootInode.metadata.ino, 'directory', null);
  }

  /**
   * Traverses the tree to find a node by absolute or relative path.
   */
  public findNode(path: string, followSymlinks: boolean = true): VFSTreeNode | null {
    const norm = Path.normalize(path);
    if (norm === '/' || norm === '.') return this.root;

    const segments = Path.split(norm);
    let current: VFSTreeNode | null = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!current || !current.isDirectory) return null;

      const next = current.getChild(seg);
      if (!next) return null;

      if (next.type === 'symlink' && followSymlinks) {
        const inode = this.inodeTable.get(next.ino);
        if (inode && inode.symlinkTarget) {
          const resolvedTarget = Path.resolve(current.getFullPath(), inode.symlinkTarget);
          const targetNode = this.findNode(resolvedTarget, true);
          if (!targetNode) return null;
          current = targetNode;
          continue;
        }
      }

      current = next;
    }

    return current;
  }

  /**
   * Adds a node into the filesystem tree at the specified path.
   */
  public insertNode(
    parentPath: string,
    name: string,
    type: VFSNodeType,
    mode?: number,
    uid: number = 0,
    gid: number = 0
  ): VFSTreeNode {
    const parentNode = this.findNode(parentPath, true);
    if (!parentNode) {
      throw new Error(`ENOENT: No such parent directory ${parentPath}`);
    }
    if (!parentNode.isDirectory) {
      throw new Error(`ENOTDIR: Parent path is not a directory ${parentPath}`);
    }
    if (parentNode.getChild(name)) {
      throw new Error(`EEXIST: File or directory already exists '${name}'`);
    }

    const inode = this.inodeTable.allocate(type, mode, uid, gid);
    const newNode = new VFSTreeNode(name, inode.metadata.ino, type, parentNode);
    parentNode.addChild(newNode);
    parentNode.ino && this.inodeTable.get(parentNode.ino)?.touchModify();

    return newNode;
  }

  /**
   * Removes a node from the filesystem tree.
   */
  public deleteNode(path: string): boolean {
    const norm = Path.normalize(path);
    if (norm === '/') {
      throw new Error(`EBUSY: Cannot remove root directory`);
    }

    const parentPath = Path.dirname(norm);
    const baseName = Path.basename(norm);

    const parentNode = this.findNode(parentPath, true);
    if (!parentNode) {
      throw new Error(`ENOENT: Parent directory not found ${parentPath}`);
    }

    const targetNode = parentNode.getChild(baseName);
    if (!targetNode) {
      throw new Error(`ENOENT: File not found ${path}`);
    }

    if (targetNode.isDirectory && targetNode.children.size > 0) {
      throw new Error(`ENOTEMPTY: Directory not empty ${path}`);
    }

    parentNode.removeChild(baseName);
    this.inodeTable.decrementLink(targetNode.ino);
    this.inodeTable.get(parentNode.ino)?.touchModify();

    return true;
  }
}
