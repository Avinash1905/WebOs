/**
 * @file SchemaMigrationEngine.ts
 * @description Versioned schema migrations for persistent storage namespaces.
 */

import type { StorageEngine } from './StorageEngine.js';

export interface StorageMigration {
  readonly version: number;
  readonly name: string;
  readonly up: (storage: StorageEngine) => Promise<void>;
  readonly down?: (storage: StorageEngine) => Promise<void>;
}

export class SchemaMigrationEngine {
  private readonly _migrations: StorageMigration[] = [];
  private readonly _storage: StorageEngine;
  private readonly _schemaKey = '__schema_version__';

  constructor(storage: StorageEngine) {
    this._storage = storage;
  }

  public registerMigration(migration: StorageMigration): void {
    if (this._migrations.some((m) => m.version === migration.version)) {
      throw new Error(`Migration for version ${migration.version} already registered`);
    }
    this._migrations.push(migration);
    this._migrations.sort((a, b) => a.version - b.version);
  }

  public async getCurrentVersion(): Promise<number> {
    const ver = await this._storage.get<number>(this._schemaKey);
    return ver ?? 0;
  }

  public async migrateToLatest(): Promise<{ previousVersion: number; newVersion: number; appliedCount: number }> {
    const currentVersion = await this.getCurrentVersion();
    let appliedCount = 0;
    let latestVersion = currentVersion;

    for (const m of this._migrations) {
      if (m.version > currentVersion) {
        await m.up(this._storage);
        await this._storage.set(this._schemaKey, m.version);
        latestVersion = m.version;
        appliedCount++;
      }
    }

    return {
      previousVersion: currentVersion,
      newVersion: latestVersion,
      appliedCount,
    };
  }
}
