/**
 * @file IndexedDBAdapter.ts
 * @description Production IndexedDB storage driver for browser-based WebOS persistence.
 */

import type { StorageAdapter } from './StorageAdapter.js';
import {
  StorageConnectionError,
  StorageDeleteError,
  StorageInitializationError,
  StorageReadError,
  StorageWriteError,
} from './StorageError.js';

/**
 * StorageAdapter implementation backed by browser IndexedDB.
 */
export class IndexedDBAdapter implements StorageAdapter {
  public readonly name = 'indexeddb';

  private readonly _databaseName: string;
  private readonly _version: number;
  private readonly _storeName: string;

  private _db: IDBDatabase | null = null;
  private _isInitialized = false;

  constructor(
    databaseName: string = 'webos_storage',
    version: number = 1,
    storeName: string = 'os_data'
  ) {
    this._databaseName = databaseName;
    this._version = version;
    this._storeName = storeName;
  }

  /**
   * Opens or upgrades the IndexedDB database.
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized && this._db) {
      return;
    }

    const idbFactory = this.getIdbFactory();
    if (!idbFactory) {
      throw new StorageInitializationError(
        this.name,
        'IndexedDB is not available in the current environment.'
      );
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const request = idbFactory.open(this._databaseName, this._version);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this._storeName)) {
            db.createObjectStore(this._storeName);
          }
        };

        request.onsuccess = (event) => {
          this._db = (event.target as IDBOpenDBRequest).result;
          this._isInitialized = true;

          this._db.onversionchange = () => {
            this._db?.close();
            this._db = null;
            this._isInitialized = false;
          };

          this._db.onclose = () => {
            this._db = null;
            this._isInitialized = false;
          };

          resolve();
        };

        request.onerror = (event) => {
          const error = (event.target as IDBOpenDBRequest).error;
          reject(new StorageInitializationError(this.name, error));
        };

        request.onblocked = () => {
          console.warn(`[IndexedDBAdapter] Database '${this._databaseName}' open is blocked.`);
        };
      } catch (err) {
        reject(new StorageInitializationError(this.name, err));
      }
    });
  }

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    const store = this.getStore('readonly', 'get');
    return new Promise<T | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : undefined);
      };
      request.onerror = () => {
        reject(new StorageReadError(key, undefined, request.error));
      };
    });
  }

  public async set<T = unknown>(key: string, value: T): Promise<void> {
    const store = this.getStore('readwrite', 'set');
    return new Promise<void>((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageWriteError(key, undefined, request.error));
    });
  }

  public async delete(key: string): Promise<void> {
    const store = this.getStore('readwrite', 'delete');
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageDeleteError(key, undefined, request.error));
    });
  }

  public async has(key: string): Promise<boolean> {
    const store = this.getStore('readonly', 'has');
    return new Promise<boolean>((resolve, reject) => {
      const request = store.count(key);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(new StorageReadError(key, undefined, request.error));
    });
  }

  public async clear(): Promise<void> {
    const store = this.getStore('readwrite', 'clear');
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new StorageDeleteError('*', undefined, request.error));
    });
  }

  public async keys(prefix?: string): Promise<string[]> {
    const store = this.getStore('readonly', 'keys');
    return new Promise<string[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const allKeys = (request.result as string[]).map((k) => String(k));
        if (!prefix) {
          resolve(allKeys);
        } else {
          resolve(allKeys.filter((k) => k.startsWith(prefix)));
        }
      };
      request.onerror = () =>
        reject(new StorageReadError('keys', undefined, request.error));
    });
  }

  public async getMany<T = unknown>(keys: readonly string[]): Promise<Map<string, T>> {
    if (keys.length === 0) {
      return new Map();
    }
    const store = this.getStore('readonly', 'getMany');
    const map = new Map<string, T>();

    return new Promise<Map<string, T>>((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      for (const key of keys) {
        const req = store.get(key);
        req.onsuccess = () => {
          if (hasError) return;
          if (req.result !== undefined) {
            map.set(key, req.result as T);
          }
          completed++;
          if (completed === keys.length) {
            resolve(map);
          }
        };
        req.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new StorageReadError(key, undefined, req.error));
          }
        };
      }
    });
  }

  public async setMany<T = unknown>(entries: readonly (readonly [string, T])[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const store = this.getStore('readwrite', 'setMany');

    return new Promise<void>((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      for (const [key, value] of entries) {
        const req = store.put(value, key);
        req.onsuccess = () => {
          if (hasError) return;
          completed++;
          if (completed === entries.length) {
            resolve();
          }
        };
        req.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new StorageWriteError(key, undefined, req.error));
          }
        };
      }
    });
  }

  public async deleteMany(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    const store = this.getStore('readwrite', 'deleteMany');

    return new Promise<void>((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      for (const key of keys) {
        const req = store.delete(key);
        req.onsuccess = () => {
          if (hasError) return;
          completed++;
          if (completed === keys.length) {
            resolve();
          }
        };
        req.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new StorageDeleteError(key, undefined, req.error));
          }
        };
      }
    });
  }

  public async close(): Promise<void> {
    if (this._db) {
      this._db.close();
      this._db = null;
    }
    this._isInitialized = false;
  }

  private getIdbFactory(): IDBFactory | undefined {
    if (typeof indexedDB !== 'undefined') {
      return indexedDB;
    }
    if (typeof globalThis !== 'undefined' && 'indexedDB' in globalThis) {
      return (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB;
    }
    return undefined;
  }

  private getStore(mode: IDBTransactionMode, op: string): IDBObjectStore {
    if (!this._db || !this._isInitialized) {
      throw new StorageConnectionError(op, 'Database is not open or initialized.');
    }
    try {
      const tx = this._db.transaction(this._storeName, mode);
      return tx.objectStore(this._storeName);
    } catch (err) {
      throw new StorageConnectionError(op, err);
    }
  }
}
