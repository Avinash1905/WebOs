/**
 * @file StorageDriverPool.ts
 * @description Driver pool managing primary and fallback storage adapters with automatic failover.
 */

import type { StorageAdapter } from './StorageAdapter.js';
import { MemoryAdapter } from './MemoryAdapter.js';

export class StorageDriverPool {
  private readonly _drivers: StorageAdapter[] = [];
  private _activeDriverIndex = 0;

  constructor(primaryDrivers: StorageAdapter[] = []) {
    this._drivers = [...primaryDrivers];
    if (this._drivers.length === 0) {
      this._drivers.push(new MemoryAdapter());
    }
  }

  public getActiveDriver(): StorageAdapter {
    const driver = this._drivers[this._activeDriverIndex];
    if (!driver) {
      return this._drivers[0] ?? new MemoryAdapter();
    }
    return driver;
  }

  public async initializeAll(): Promise<void> {
    for (const d of this._drivers) {
      try {
        await d.initialize();
      } catch {
        // Driver failed to init, continue to next
      }
    }
  }

  public async executeWithFallback<T>(
    operation: (driver: StorageAdapter) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;

    for (let i = this._activeDriverIndex; i < this._drivers.length; i++) {
      const driver = this._drivers[i];
      if (!driver) continue;

      try {
        const result = await operation(driver);
        this._activeDriverIndex = i;
        return result;
      } catch (err) {
        lastError = err;
        // Try fallback to next driver
      }
    }

    throw lastError ?? new Error('All storage drivers failed');
  }
}
