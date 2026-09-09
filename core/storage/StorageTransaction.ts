/**
 * @file StorageTransaction.ts
 * @description Atomic transaction staging and commit management for WebOS storage operations.
 */

import type { CacheManager } from './CacheManager.js';
import type { StorageAdapter } from './StorageAdapter.js';
import { StorageTransactionError } from './StorageError.js';
import type { BatchOperation } from './types.js';

/**
 * Encapsulates an atomic storage transaction, staging writes and deletes until committed.
 */
export class StorageTransaction {
  private readonly _adapter: StorageAdapter;
  private readonly _cache: CacheManager;
  private readonly _operations = new Map<string, BatchOperation>();
  private _isCommitted = false;
  private _isRolledBack = false;

  constructor(adapter: StorageAdapter, cache: CacheManager) {
    this._adapter = adapter;
    this._cache = cache;
  }

  /**
   * Reads a key within the transaction context, reflecting any staged writes or deletes.
   */
  public async get<T = unknown>(key: string): Promise<T | undefined> {
    this.assertActive('get');

    const staged = this._operations.get(key);
    if (staged) {
      if (staged.type === 'delete') {
        return undefined;
      }
      return staged.value as T;
    }

    // Fall back to cache or underlying adapter
    const cached = this._cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    return this._adapter.get<T>(key);
  }

  /**
   * Stages a write operation within the transaction.
   */
  public set<T = unknown>(key: string, value: T): void {
    this.assertActive('set');
    this._operations.set(key, { type: 'set', key, value });
  }

  /**
   * Stages a delete operation within the transaction.
   */
  public delete(key: string): void {
    this.assertActive('delete');
    this._operations.set(key, { type: 'delete', key });
  }

  /**
   * Checks whether a key will exist after this transaction commits.
   */
  public async has(key: string): Promise<boolean> {
    this.assertActive('has');

    const staged = this._operations.get(key);
    if (staged) {
      return staged.type === 'set';
    }

    return this._adapter.has(key);
  }

  /**
   * Commits all staged operations atomically to the underlying adapter and updates the cache.
   */
  public async commit(): Promise<void> {
    this.assertActive('commit');

    if (this._operations.size === 0) {
      this._isCommitted = true;
      return;
    }

    const sets: [string, unknown][] = [];
    const deletes: string[] = [];

    for (const op of this._operations.values()) {
      if (op.type === 'set') {
        sets.push([op.key, op.value]);
      } else if (op.type === 'delete') {
        deletes.push(op.key);
      }
    }

    try {
      if (sets.length > 0) {
        await this._adapter.setMany(sets);
      }
      if (deletes.length > 0) {
        await this._adapter.deleteMany(deletes);
      }

      // Apply changes to cache after successful storage write
      for (const [key, value] of sets) {
        this._cache.set(key, value);
      }
      for (const key of deletes) {
        this._cache.delete(key);
      }

      this._isCommitted = true;
    } catch (err) {
      this.rollback();
      throw new StorageTransactionError('commit', 'Failed to commit transaction operations.', err);
    }
  }

  /**
   * Discards all staged operations in this transaction.
   */
  public rollback(): void {
    this._operations.clear();
    this._isRolledBack = true;
  }

  private assertActive(op: string): void {
    if (this._isCommitted) {
      throw new StorageTransactionError(op, 'Transaction has already been committed.');
    }
    if (this._isRolledBack) {
      throw new StorageTransactionError(op, 'Transaction has been rolled back.');
    }
  }
}
