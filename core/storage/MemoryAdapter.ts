/**
 * @file MemoryAdapter.ts
 * @description In-memory storage adapter for testing, development, and fallback environments.
 */

import type { StorageAdapter } from './StorageAdapter.js';
import { StorageConnectionError } from './StorageError.js';

/**
 * In-memory implementation of StorageAdapter.
 */
export class MemoryAdapter implements StorageAdapter {
  public readonly name = 'memory';

  private _data = new Map<string, unknown>();
  private _initialized = false;
  private _closed = false;

  public async initialize(): Promise<void> {
    this._closed = false;
    this._initialized = true;
  }

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    this.assertActive('get');
    const val = this._data.get(key);
    return val !== undefined ? (this.cloneValue(val) as T) : undefined;
  }

  public async set<T = unknown>(key: string, value: T): Promise<void> {
    this.assertActive('set');
    this._data.set(key, this.cloneValue(value));
  }

  public async delete(key: string): Promise<void> {
    this.assertActive('delete');
    this._data.delete(key);
  }

  public async has(key: string): Promise<boolean> {
    this.assertActive('has');
    return this._data.has(key);
  }

  public async clear(): Promise<void> {
    this.assertActive('clear');
    this._data.clear();
  }

  public async keys(prefix?: string): Promise<string[]> {
    this.assertActive('keys');
    const allKeys = Array.from(this._data.keys());
    if (!prefix) {
      return allKeys;
    }
    return allKeys.filter((k) => k.startsWith(prefix));
  }

  public async getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>> {
    this.assertActive('getMany');
    const map = new Map<string, T>();
    for (const k of keys) {
      const val = this._data.get(k);
      if (val !== undefined) {
        map.set(k, this.cloneValue(val) as T);
      }
    }
    return map;
  }

  public async setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void> {
    this.assertActive('setMany');
    for (const [key, value] of entries) {
      this._data.set(key, this.cloneValue(value));
    }
  }

  public async deleteMany(keys: readonly string[]): Promise<void> {
    this.assertActive('deleteMany');
    for (const k of keys) {
      this._data.delete(k);
    }
  }

  public async close(): Promise<void> {
    this._closed = true;
    this._initialized = false;
  }

  /**
   * Helper to clone values stored in memory to prevent external mutations.
   */
  private cloneValue<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (value instanceof Date) {
      return new Date(value.getTime()) as unknown as T;
    }
    if (value instanceof Uint8Array) {
      return new Uint8Array(value) as unknown as T;
    }
    if (value instanceof ArrayBuffer) {
      return value.slice(0) as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.cloneValue(item)) as unknown as T;
    }
    try {
      if (typeof structuredClone === 'function') {
        return structuredClone(value);
      }
    } catch {
      // Fallback to manual object copy
    }
    const copy = Object.create(Object.getPrototypeOf(value));
    for (const [k, v] of Object.entries(value)) {
      copy[k] = this.cloneValue(v);
    }
    return copy;
  }

  private assertActive(op: string): void {
    if (this._closed || !this._initialized) {
      throw new StorageConnectionError(op, 'Memory adapter is not initialized or has been closed.');
    }
  }
}
