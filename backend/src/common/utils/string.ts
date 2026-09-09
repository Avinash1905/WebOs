/**
 * WebOS Backend Foundation - String Utilities
 */

export const StringUtils = {
  /**
   * Safely truncate long strings (e.g. for error logs or body snippets)
   */
  truncate(str: string, maxLength: number, suffix = '...'): string {
    if (!str || str.length <= maxLength) {
      return str;
    }
    const truncatedLen = Math.max(0, maxLength - suffix.length);
    return `${str.slice(0, truncatedLen)}${suffix}`;
  },

  /**
   * Clean and normalize a route path
   */
  normalizePath(path: string): string {
    if (!path) return '/';
    let normalized = path.replace(/\/+/g, '/');
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  },

  /**
   * Convert camelCase / PascalCase to kebab-case
   */
  toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  /**
   * Safely parse JSON or return null on failure without throwing
   */
  safeJsonParse<T = unknown>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
} as const;
