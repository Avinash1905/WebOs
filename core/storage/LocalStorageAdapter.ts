/**
 * @file LocalStorageAdapter.ts
 * @description Synchronous/asynchronous browser window.localStorage storage adapter with quota detection.
 */

import type { StorageAdapter } from './StorageAdapter.js';
import { StorageQuotaError, StorageConnectionError } from './StorageError.js';

export class LocalStorageAdapter implements StorageAdapter {
  public readonly name = 'localstorage';
  private readonly _prefix: string;
  private _initialized = false;
  private _closed = false;

  constructor(prefix = 'webos:') {
    this._prefix = prefix;
  }

  public async initialize(): Promise<void> {
    this._closed = false;
    this._initialized = true;
  }

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    this.assertActive('get');
    try {
      if (typeof localStorage === 'undefined') return undefined;
      const raw = localStorage.getItem(this._prefix + key);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  public async set<T = unknown>(key: string, value: T): Promise<void> {
    this.assertActive('set');
    if (typeof localStorage === 'undefined') return;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this._prefix + key, serialized);
    } catch (err: any) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        throw new StorageQuotaError(0, 0, 'LocalStorage quota exceeded');
      }
      throw err;
    }
  }

  public async delete(key: string): Promise<void> {
    this.assertActive('delete');
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this._prefix + key);
  }

  public async has(key: string): Promise<boolean> {
    this.assertActive('has');
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this._prefix + key) !== null;
  }

  public async keys(prefix?: string): Promise<string[]> {
    this.assertActive('keys');
    if (typeof localStorage === 'undefined') return [];
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this._prefix)) {
        const stripped = k.slice(this._prefix.length);
        if (!prefix || stripped.startsWith(prefix)) {
          result.push(stripped);
        }
      }
    }
    return result;
  }

  public async getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>> {
    this.assertActive('getMany');
    const result = new Map<string, T>();
    for (const key of keys) {
      const val = await this.get<T>(key);
      if (val !== undefined) {
        result.set(key, val);
      }
    }
    return result;
  }

  public async setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void> {
    this.assertActive('setMany');
    for (const [k, v] of entries) {
      await this.set(k, v);
    }
  }

  public async deleteMany(keys: readonly string[]): Promise<void> {
    this.assertActive('deleteMany');
    for (const k of keys) {
      await this.delete(k);
    }
  }

  public async clear(): Promise<void> {
    this.assertActive('clear');
    const allKeys = await this.keys();
    for (const k of allKeys) {
      localStorage.removeItem(this._prefix + k);
    }
  }

  public async close(): Promise<void> {
    this._closed = true;
    this._initialized = false;
  }

  private assertActive(op: string): void {
    if (!this._initialized || this._closed) {
      throw new StorageConnectionError(this.name, `Cannot perform '${op}': adapter is not initialized or is closed.`);
    }
  }
}
