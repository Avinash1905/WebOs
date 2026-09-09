/**
 * @file SearchFilter.ts
 * @description Filters search candidates by root path, type, extension, and permissions.
 */

import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import type { SearchIndexEntry, SearchOptions } from './types.js';

export class SearchFilter {
  /**
   * Synchronously filters an entry by path scope, file type, and extension.
   */
  public static matchesOptions(entry: SearchIndexEntry, options: SearchOptions): boolean {
    const rootPath = options.rootPath ?? '/';

    // 1. Root path scoping
    if (rootPath !== '/') {
      const normalizedRoot = rootPath.replace(/\/+$/, '');
      if (entry.path !== normalizedRoot && !entry.path.startsWith(normalizedRoot + '/')) {
        return false;
      }
    }

    // 2. Include Files / Directories
    const includeFiles = options.includeFiles !== false;
    const includeDirs = options.includeDirectories !== false;

    if (entry.type === 'file' && !includeFiles) return false;
    if (entry.type === 'directory' && !includeDirs) return false;

    // 3. File Types filter
    if (options.fileTypes && options.fileTypes.length > 0) {
      if (!options.fileTypes.includes(entry.type)) {
        return false;
      }
    }

    // 4. Extension filter
    if (options.extensions && options.extensions.length > 0) {
      if (entry.type !== 'file') return false;
      const normalizedExtensions = options.extensions.map((ext) =>
        ext.startsWith('.') ? ext.slice(1).toLowerCase() : ext.toLowerCase()
      );
      const entryExt = (entry.extension ?? '').replace(/^\./, '').toLowerCase();
      if (!normalizedExtensions.includes(entryExt)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluates read permission on a search candidate.
   */
  public static async hasPermission(
    entry: SearchIndexEntry,
    permissionManager?: PermissionManager,
    context?: Partial<SecurityContext>
  ): Promise<boolean> {
    if (!permissionManager || !context) {
      return true;
    }

    if (context.isSystem) {
      return true;
    }

    return permissionManager.hasPermission(
      context,
      {
        path: entry.path,
        ownerId: entry.ownerId,
        mode: entry.mode,
        isDirectory: entry.type === 'directory',
      },
      'READ'
    );
  }
}
