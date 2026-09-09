/**
 * WebOS Core - Path Utility Library
 * POSIX path manipulation, normalization, joining, relative path computation.
 */

export class Path {
  public static readonly SEP = '/';
  public static readonly DELIMITER = ':';

  /**
   * Normalizes a path, resolving '.' and '..' segments and eliminating duplicate slashes.
   */
  public static normalize(path: string): string {
    if (!path || path.trim() === '') return '.';

    const isAbs = path.startsWith('/');
    const trailingSlash = path.endsWith('/') && path.length > 1;

    const segments = path.split('/').filter(Boolean);
    const resolvedSegments: string[] = [];

    for (const seg of segments) {
      if (seg === '.') {
        continue;
      }
      if (seg === '..') {
        if (resolvedSegments.length > 0 && resolvedSegments[resolvedSegments.length - 1] !== '..') {
          resolvedSegments.pop();
        } else if (!isAbs) {
          resolvedSegments.push('..');
        }
      } else {
        resolvedSegments.push(seg);
      }
    }

    let result = resolvedSegments.join('/');
    if (isAbs) {
      result = '/' + result;
    }
    if (result === '') {
      result = isAbs ? '/' : '.';
    }
    if (trailingSlash && !result.endsWith('/') && result !== '/') {
      result += '/';
    }

    return result;
  }

  /**
   * Joins multiple path components into a single normalized path.
   */
  public static join(...paths: string[]): string {
    if (paths.length === 0) return '.';
    const joined = paths.filter((p) => typeof p === 'string' && p.trim().length > 0).join('/');
    return Path.normalize(joined);
  }

  /**
   * Resolves a sequence of paths or path segments into an absolute path relative to a base working directory.
   */
  public static resolve(baseCwd: string, ...paths: string[]): string {
    let resolvedPath = '';
    let resolvedAbsolute = false;

    for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      const p = i >= 0 ? paths[i] : baseCwd;
      if (!p || p.trim().length === 0) continue;

      resolvedPath = p + '/' + resolvedPath;
      resolvedAbsolute = p.startsWith('/');
    }

    if (!resolvedAbsolute) {
      resolvedPath = '/' + resolvedPath;
    }

    return Path.normalize(resolvedPath);
  }

  /**
   * Checks if a path is absolute.
   */
  public static isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }

  /**
   * Returns the directory name of a path.
   */
  public static dirname(path: string): string {
    const norm = Path.normalize(path);
    if (norm === '/' || norm === '.') return norm;

    const lastSlash = norm.lastIndexOf('/');
    if (lastSlash === -1) return '.';
    if (lastSlash === 0) return '/';

    return norm.substring(0, lastSlash);
  }

  /**
   * Returns the last portion of a path.
   */
  public static basename(path: string, ext?: string): string {
    const norm = Path.normalize(path);
    const clean = norm.endsWith('/') && norm.length > 1 ? norm.slice(0, -1) : norm;
    const lastSlash = clean.lastIndexOf('/');
    let base = lastSlash === -1 ? clean : clean.substring(lastSlash + 1);

    if (ext && base.endsWith(ext)) {
      base = base.substring(0, base.length - ext.length);
    }
    return base;
  }

  /**
   * Returns the extension of the path.
   */
  public static extname(path: string): string {
    const base = Path.basename(path);
    const lastDot = base.lastIndexOf('.');
    if (lastDot <= 0) return '';
    return base.substring(lastDot);
  }

  /**
   * Computes the relative path from `from` to `to`.
   */
  public static relative(from: string, to: string): string {
    const fromNorm = Path.resolve('/', from);
    const toNorm = Path.resolve('/', to);

    if (fromNorm === toNorm) return '';

    const fromParts = fromNorm.split('/').filter(Boolean);
    const toParts = toNorm.split('/').filter(Boolean);

    let commonIndex = 0;
    while (
      commonIndex < fromParts.length &&
      commonIndex < toParts.length &&
      fromParts[commonIndex] === toParts[commonIndex]
    ) {
      commonIndex++;
    }

    const upSegments = fromParts.length - commonIndex;
    const resultParts: string[] = [];

    for (let i = 0; i < upSegments; i++) {
      resultParts.push('..');
    }

    for (let i = commonIndex; i < toParts.length; i++) {
      resultParts.push(toParts[i]);
    }

    return resultParts.join('/') || '.';
  }

  /**
   * Splits a path into its constituent segment array.
   */
  public static split(path: string): string[] {
    const norm = Path.normalize(path);
    return norm.split('/').filter(Boolean);
  }
}
