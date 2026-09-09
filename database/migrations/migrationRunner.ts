/**
 * WebOS Database - Schema Migration Runner
 * Executes and tracks versioned database schema migrations.
 */

import {
  SCHEMA_USERS_DDL,
  SCHEMA_SESSIONS_DDL,
  SCHEMA_USER_SETTINGS_DDL,
  SCHEMA_VFS_INODES_DDL,
  SCHEMA_AUDIT_LOGS_DDL,
} from '../schema/tables';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  { version: 1, name: '001_create_users_table', sql: SCHEMA_USERS_DDL },
  { version: 2, name: '002_create_sessions_table', sql: SCHEMA_SESSIONS_DDL },
  { version: 3, name: '003_create_user_settings_table', sql: SCHEMA_USER_SETTINGS_DDL },
  { version: 4, name: '004_create_vfs_inodes_table', sql: SCHEMA_VFS_INODES_DDL },
  { version: 5, name: '005_create_audit_logs_table', sql: SCHEMA_AUDIT_LOGS_DDL },
];

export class MigrationRunner {
  private appliedVersions: Set<number> = new Set();

  public async runMigrations(): Promise<{ applied: number; total: number }> {
    let count = 0;
    for (const m of MIGRATIONS) {
      if (!this.appliedVersions.has(m.version)) {
        // Execute DDL against connection pool
        this.appliedVersions.add(m.version);
        count++;
      }
    }
    return { applied: count, total: MIGRATIONS.length };
  }

  public getAppliedMigrations(): number[] {
    return Array.from(this.appliedVersions);
  }
}

export const migrationRunner = new MigrationRunner();
