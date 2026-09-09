/**
 * @file applications/database-viewer/engine/DatabaseService.ts
 * @description Local database engine wrapper for inspecting, querying, and mutating WebOS IndexedDB/VFS system data.
 */

import { platform } from '../../../src/services/webosPlatform.js';
import type {
  DatabaseMetadata,
  SchemaMetadata,
  TableSchema,
  QueryResult,
} from '../types.js';

export class DatabaseService {
  private static mockSystemDb: DatabaseMetadata = {
    id: 'webos_system_db',
    name: 'webos_system.db',
    sizeBytes: 1048576,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    schemas: [
      {
        name: 'main',
        tables: [
          {
            name: 'users',
            rowCount: 4,
            columns: [
              { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
              { name: 'username', type: 'TEXT', nullable: false, isPrimaryKey: false },
              { name: 'role', type: 'TEXT', nullable: false, isPrimaryKey: false },
              { name: 'created_at', type: 'DATETIME', nullable: false, isPrimaryKey: false },
            ],
            constraints: [
              { name: 'pk_users', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
            ],
            indexes: [
              { name: 'idx_users_username', columns: ['username'], isUnique: true },
            ],
          },
          {
            name: 'processes_log',
            rowCount: 12,
            columns: [
              { name: 'pid', type: 'INTEGER', nullable: false, isPrimaryKey: true },
              { name: 'app_id', type: 'TEXT', nullable: false, isPrimaryKey: false },
              { name: 'status', type: 'TEXT', nullable: false, isPrimaryKey: false },
              { name: 'memory_mb', type: 'REAL', nullable: false, isPrimaryKey: false },
              { name: 'cpu_pct', type: 'REAL', nullable: false, isPrimaryKey: false },
            ],
            constraints: [
              { name: 'pk_processes', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (pid)' },
            ],
            indexes: [],
          },
          {
            name: 'app_settings',
            rowCount: 8,
            columns: [
              { name: 'key', type: 'TEXT', nullable: false, isPrimaryKey: true },
              { name: 'value', type: 'TEXT', nullable: false, isPrimaryKey: false },
              { name: 'category', type: 'TEXT', nullable: true, isPrimaryKey: false },
            ],
            constraints: [
              { name: 'pk_settings', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (key)' },
            ],
            indexes: [],
          },
        ],
        views: [
          {
            name: 'active_admin_users',
            sql: "SELECT * FROM users WHERE role = 'admin'",
          },
        ],
      },
    ],
  };

  private static mockDataStores: Record<string, Record<string, any>[]> = {
    users: [
      { id: 1, username: 'admin', role: 'admin', created_at: '2026-01-01 10:00:00' },
      { id: 2, username: 'guest', role: 'user', created_at: '2026-02-15 14:30:00' },
      { id: 3, username: 'developer', role: 'admin', created_at: '2026-03-10 09:15:00' },
      { id: 4, username: 'auditor', role: 'viewer', created_at: '2026-04-01 11:45:00' },
    ],
    processes_log: [
      { pid: 101, app_id: 'system-kernel', status: 'running', memory_mb: 45.2, cpu_pct: 1.2 },
      { pid: 102, app_id: 'window-manager', status: 'running', memory_mb: 32.8, cpu_pct: 2.5 },
      { pid: 103, app_id: 'file-manager', status: 'suspended', memory_mb: 18.4, cpu_pct: 0.0 },
      { pid: 104, app_id: 'calculator', status: 'running', memory_mb: 12.1, cpu_pct: 0.1 },
      { pid: 105, app_id: 'spreadsheet', status: 'running', memory_mb: 68.5, cpu_pct: 3.4 },
      { pid: 106, app_id: 'database-viewer', status: 'running', memory_mb: 28.0, cpu_pct: 0.8 },
      { pid: 107, app_id: 'task-manager', status: 'running', memory_mb: 22.3, cpu_pct: 1.1 },
    ],
    app_settings: [
      { key: 'theme.mode', value: 'dark', category: 'appearance' },
      { key: 'theme.accent', value: '#3b82f6', category: 'appearance' },
      { key: 'sound.volume', value: '80', category: 'audio' },
      { key: 'display.scaling', value: '100%', category: 'display' },
    ],
  };

  public static async fetchDatabases(): Promise<DatabaseMetadata[]> {
    await platform.initialize();
    return [DatabaseService.mockSystemDb];
  }

  public static async getTableRows(
    tableName: string,
    page = 1,
    pageSize = 10,
    sortCol: string | null = null,
    sortDir: 'asc' | 'desc' = 'asc',
    filterVal: string = ''
  ): Promise<{ rows: Record<string, any>[]; total: number }> {
    await platform.initialize();
    let data = DatabaseService.mockDataStores[tableName] || [];

    if (filterVal) {
      const queryLower = filterVal.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(queryLower))
      );
    }

    if (sortCol) {
      data = [...data].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = data.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = data.slice(startIndex, startIndex + pageSize);

    return { rows: paginated, total };
  }

  public static async insertRecord(tableName: string, record: Record<string, any>): Promise<void> {
    if (!DatabaseService.mockDataStores[tableName]) {
      DatabaseService.mockDataStores[tableName] = [];
    }
    DatabaseService.mockDataStores[tableName].push(record);
  }

  public static async updateRecord(
    tableName: string,
    primaryKeyCol: string,
    primaryKeyVal: any,
    updatedData: Record<string, any>
  ): Promise<void> {
    const list = DatabaseService.mockDataStores[tableName] || [];
    const idx = list.findIndex((r) => r[primaryKeyCol] === primaryKeyVal);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedData };
    }
  }

  public static async deleteRecord(
    tableName: string,
    primaryKeyCol: string,
    primaryKeyVal: any
  ): Promise<void> {
    const list = DatabaseService.mockDataStores[tableName] || [];
    DatabaseService.mockDataStores[tableName] = list.filter(
      (r) => r[primaryKeyCol] !== primaryKeyVal
    );
  }
}
