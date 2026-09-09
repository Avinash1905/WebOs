/**
 * @file StorageQueryIterator.ts
 * @description Cursor-based prefix scanning, filtering, and streaming record iteration.
 */

import type { StorageEngine } from './StorageEngine.js';

export interface QueryIteratorOptions<T> {
  readonly prefix?: string;
  readonly filter?: (key: string, value: T) => boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export class StorageQueryIterator {
  public static async query<T>(
    storage: StorageEngine,
    options: QueryIteratorOptions<T> = {}
  ): Promise<{ items: { key: string; value: T }[]; total: number }> {
    const allKeys = await storage.keys(options.prefix);
    const matched: { key: string; value: T }[] = [];

    const offset = options.offset ?? 0;
    const limit = options.limit ?? allKeys.length;

    for (const key of allKeys) {
      const val = await storage.get<T>(key);
      if (val !== undefined && val !== null) {
        if (!options.filter || options.filter(key, val)) {
          matched.push({ key, value: val });
        }
      }
    }

    const paginated = matched.slice(offset, offset + limit);

    return {
      items: paginated,
      total: matched.length,
    };
  }
}
