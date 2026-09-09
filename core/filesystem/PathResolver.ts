/**
 * @file PathResolver.ts
 * @description Path normalization, resolution, sandboxing, and MIME type resolution for WebOS VFS.
 */

import { InvalidNameError, InvalidPathError } from './FileSystemError.js';

const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain',
  '.text': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.ts': 'application/typescript',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
};

/**
 * Path manipulation and sandboxing utilities for WebOS logical paths.
 */
export class PathResolver {
  /**
   * Normalizes a WebOS path to an absolute, canonical form without redundant slashes,
   * resolving '.' and '..' segments, while preventing traversal escaping outside '/'.
   *
   * @param rawPath - Input path string.
   * @returns Canonical normalized absolute path.
   */
  public static normalize(rawPath: string): string {
    if (typeof rawPath !== 'string') {
      throw new InvalidPathError(String(rawPath), 'Path must be a string.');
    }

    // Convert Windows backslashes and collapse multiple slashes
    let sanitized = rawPath.replace(/\\+/g, '/').replace(/\/+/g, '/').trim();

    if (!sanitized.startsWith('/')) {
      sanitized = '/' + sanitized;
    }

    const segments = sanitized.split('/');
    const resolved: string[] = [];

    for (const segment of segments) {
      if (segment === '' || segment === '.') {
        continue;
      }
      if (segment === '..') {
        if (resolved.length > 0) {
          resolved.pop();
        }
        // If at root, '..' is safely ignored (sandbox root protection)
      } else {
        resolved.push(segment);
      }
    }

    const result = '/' + resolved.join('/');
    return result.length > 1 && result.endsWith('/') ? result.slice(0, -1) : result;
  }

  /**
   * Resolves a series of path segments relative to a base path.
   */
  public static resolve(base: string, ...segments: string[]): string {
    let current = this.normalize(base);
    for (const seg of segments) {
      if (seg.startsWith('/')) {
        current = this.normalize(seg);
      } else {
        current = this.normalize(`${current}/${seg}`);
      }
    }
    return current;
  }

  /**
   * Joins path segments into a normalized path.
   */
  public static join(...segments: string[]): string {
    return this.normalize(segments.join('/'));
  }

  /**
   * Returns the directory path of the parent container.
   *
   * @example
   * PathResolver.dirname('/home/user/docs') // '/home/user'
   * PathResolver.dirname('/home') // '/'
   * PathResolver.dirname('/') // '/'
   */
  public static dirname(path: string): string {
    const normalized = this.normalize(path);
    if (normalized === '/') {
      return '/';
    }
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === 0) {
      return '/';
    }
    return normalized.slice(0, lastSlash);
  }

  /**
   * Returns the last segment of a path (file or folder name).
   *
   * @example
   * PathResolver.basename('/home/user/report.txt') // 'report.txt'
   * PathResolver.basename('/') // ''
   */
  public static basename(path: string): string {
    const normalized = this.normalize(path);
    if (normalized === '/') {
      return '';
    }
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.slice(lastSlash + 1);
  }

  /**
   * Returns the file extension with leading dot, or empty string if none.
   *
   * @example
   * PathResolver.extname('/docs/report.pdf') // '.pdf'
   * PathResolver.extname('/home/user') // ''
   */
  public static extname(path: string): string {
    const name = this.basename(path);
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) {
      return '';
    }
    return name.slice(lastDot).toLowerCase();
  }

  /**
   * Checks whether the path represents the root directory '/'.
   */
  public static isRoot(path: string): boolean {
    return this.normalize(path) === '/';
  }

  /**
   * Checks whether child is within the directory subtree of parent.
   */
  public static isSubpath(parent: string, child: string): boolean {
    const normParent = this.normalize(parent);
    const normChild = this.normalize(child);

    if (normParent === normChild) {
      return true;
    }
    if (normParent === '/') {
      return true;
    }
    return normChild.startsWith(normParent + '/');
  }

  /**
   * Validates a file or directory name, ensuring it contains no path separators,
   * control characters, or invalid relative tokens.
   *
   * @param name - The name to validate.
   * @throws {InvalidNameError} If the name is invalid.
   */
  public static validateName(name: string): void {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new InvalidNameError(name, 'Name cannot be empty or whitespace.');
    }
    if (name === '.' || name === '..') {
      throw new InvalidNameError(name, "Name cannot be '.' or '..'.");
    }
    if (name.includes('/') || name.includes('\\')) {
      throw new InvalidNameError(name, "Name cannot contain path separators ('/' or '\\').");
    }
    // Check for non-printable control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(name)) {
      throw new InvalidNameError(name, 'Name cannot contain control characters.');
    }
  }

  /**
   * Infers the MIME type for a given filename based on its extension.
   *
   * @param fileName - Name or path of the file.
   * @returns Inferred MIME type, or 'application/octet-stream' if unknown.
   */
  public static getMimeType(fileName: string): string {
    const ext = this.extname(fileName);
    return MIME_TYPES[ext] ?? 'application/octet-stream';
  }
}
