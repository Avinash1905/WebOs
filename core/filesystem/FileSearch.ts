/**
 * @file FileSearch.ts
 * @description In-memory filesystem search engine for WebOS VFS.
 */

import type { DirectoryTree } from './DirectoryTree.js';
import { PathResolver } from './PathResolver.js';
import type { FileMetadata, FileSearchOptions } from './types.js';

/**
 * Searches the directory tree based on name, extension, type, and path filters.
 */
export class FileSearch {
  private readonly _tree: DirectoryTree;

  constructor(tree: DirectoryTree) {
    this._tree = tree;
  }

  /**
   * Executes a search query across the virtual filesystem.
   *
   * @param options - Search criteria (string query or full options object).
   * @returns Array of matching FileMetadata items.
   */
  public search(options: FileSearchOptions | string): FileMetadata[] {
    const opts: FileSearchOptions =
      typeof options === 'string' ? { query: options } : options;

    const query = opts.query?.trim();
    const caseSensitive = opts.caseSensitive ?? false;
    const queryNormalized = query ? (caseSensitive ? query : query.toLowerCase()) : undefined;

    const targetExt = opts.extension
      ? (opts.extension.startsWith('.') ? opts.extension : `.${opts.extension}`).toLowerCase()
      : undefined;

    const pathPrefix = opts.pathPrefix ? PathResolver.normalize(opts.pathPrefix) : undefined;

    let nodes = this._tree.getAllNodes();

    // Do not return root directory in search results
    nodes = nodes.filter((n) => n.path !== '/');

    if (pathPrefix) {
      nodes = nodes.filter(
        (n) => n.path !== pathPrefix && PathResolver.isSubpath(pathPrefix, n.path)
      );
    }

    if (opts.type) {
      nodes = nodes.filter((n) => n.type === opts.type);
    }

    if (targetExt) {
      nodes = nodes.filter((n) => n.extension?.toLowerCase() === targetExt);
    }

    if (queryNormalized) {
      nodes = nodes.filter((n) => {
        const nameToMatch = caseSensitive ? n.name : n.name.toLowerCase();
        return nameToMatch.includes(queryNormalized);
      });
    }

    if (opts.maxResults !== undefined && opts.maxResults > 0) {
      nodes = nodes.slice(0, opts.maxResults);
    }

    return nodes;
  }
}
