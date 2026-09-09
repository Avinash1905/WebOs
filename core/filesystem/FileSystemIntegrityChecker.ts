/**
 * @file FileSystemIntegrityChecker.ts
 * @description File system check (fsck) and tree consistency analyzer.
 */

import type { FileSystem } from './FileSystem.js';

export interface FSCKReport {
  readonly timestamp: number;
  readonly totalNodesScanned: number;
  readonly orphanNodesFound: number;
  readonly danglingReferences: number;
  readonly fixedCount: number;
  readonly issues: readonly FSCKIssue[];
  readonly healthy: boolean;
}

export interface FSCKIssue {
  readonly code: 'ORPHAN_NODE' | 'DANGLING_PARENT' | 'CHECKSUM_MISMATCH' | 'NAME_COLLISION';
  readonly path: string;
  readonly description: string;
  readonly autoFixed: boolean;
}

export class FileSystemIntegrityChecker {
  constructor(private readonly fs: FileSystem) {}

  public async check(options?: { autoRepair?: boolean }): Promise<FSCKReport> {
    const autoRepair = options?.autoRepair ?? false;
    const issues: FSCKIssue[] = [];
    let fixedCount = 0;

    const allNodes = await this.fs.listDirectory('/', { recursive: true, includeHidden: true });
    const paths = new Set(allNodes.map(n => n.path));
    paths.add('/');

    for (const node of allNodes) {
      // Check parent existence
      if (node.parentId && node.path !== '/') {
        const parentPath = this.getParentPath(node.path);
        if (!paths.has(parentPath)) {
          issues.push({
            code: 'DANGLING_PARENT',
            path: node.path,
            description: `Node ${node.path} has non-existent parent directory ${parentPath}`,
            autoFixed: autoRepair
          });
          if (autoRepair) {
            await this.fs.createDirectory(parentPath, { recursive: true });
            paths.add(parentPath);
            fixedCount++;
          }
        }
      }
    }

    return {
      timestamp: Date.now(),
      totalNodesScanned: allNodes.length,
      orphanNodesFound: issues.filter(i => i.code === 'ORPHAN_NODE').length,
      danglingReferences: issues.filter(i => i.code === 'DANGLING_PARENT').length,
      fixedCount,
      issues: Object.freeze(issues),
      healthy: issues.length === 0 || (autoRepair && fixedCount === issues.length)
    };
  }

  private getParentPath(p: string): string {
    const parts = p.split('/').filter(Boolean);
    if (parts.length <= 1) return '/';
    parts.pop();
    return `/${parts.join('/')}`;
  }
}
