/**
 * WebOS Backend Foundation - Object & Data Utilities
 */

export const ObjectUtils = {
  /**
   * Recursively deep freeze an object to guarantee immutability (e.g. for configs)
   */
  deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    Object.freeze(obj);

    for (const key of Object.getOwnPropertyNames(obj)) {
      const prop = (obj as Record<string, unknown>)[key];
      if (prop !== null && (typeof prop === 'object' || typeof prop === 'function') && !Object.isFrozen(prop)) {
        ObjectUtils.deepFreeze(prop);
      }
    }

    return obj;
  },

  /**
   * Deep clone an object safely
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => ObjectUtils.deepClone(item)) as unknown as T;
    }
    const cloned = {} as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key];
      cloned[key] = ObjectUtils.deepClone(val);
    }
    return cloned as T;
  },

  /**
   * Pick specific keys from an object
   */
  pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Omit specific keys from an object
   */
  omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  /**
   * Mask sensitive keys in an object (e.g., for logging)
   */
  maskKeys<T extends Record<string, unknown>>(
    obj: T,
    sensitiveKeys: readonly string[],
    mask = '[REDACTED]'
  ): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    const lowerKeys = new Set(sensitiveKeys.map((k) => k.toLowerCase()));

    for (const [key, val] of Object.entries(obj)) {
      if (lowerKeys.has(key.toLowerCase())) {
        masked[key] = mask;
      } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        masked[key] = ObjectUtils.maskKeys(val as Record<string, unknown>, sensitiveKeys, mask);
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }
} as const;
