/**
 * @file tests/applications/DatabaseViewer.test.ts
 * @description Comprehensive unit tests for WebOS Database Viewer service, SQL parser, table pagination, and record mutators.
 */

import { describe, it, expect } from 'vitest';
import { DatabaseService } from '../../applications/database-viewer/engine/DatabaseService.js';
import { SqlQueryEngine } from '../../applications/database-viewer/engine/SqlQueryEngine.js';

describe('DatabaseViewer — DatabaseService Engine', () => {
  it('should fetch system databases and schema metadata', async () => {
    const dbs = await DatabaseService.fetchDatabases();
    expect(dbs.length).toBeGreaterThan(0);
    expect(dbs[0].name).toBe('webos_system.db');
    expect(dbs[0].schemas[0].tables.length).toBeGreaterThan(0);
  });

  it('should fetch table rows with pagination', async () => {
    const res = await DatabaseService.getTableRows('users', 1, 2);
    expect(res.rows.length).toBe(2);
    expect(res.total).toBeGreaterThanOrEqual(4);
  });

  it('should filter table rows by search query', async () => {
    const res = await DatabaseService.getTableRows('users', 1, 10, null, 'asc', 'admin');
    expect(res.rows.length).toBe(2);
    expect(res.rows.every((r) => r.role === 'admin' || r.username === 'admin')).toBe(true);
  });

  it('should sort table rows', async () => {
    const res = await DatabaseService.getTableRows('users', 1, 10, 'username', 'asc');
    expect(res.rows[0].username).toBe('admin');
  });

  it('should insert, update, and delete records', async () => {
    await DatabaseService.insertRecord('app_settings', { key: 'test.key', value: '123', category: 'test' });
    let res = await DatabaseService.getTableRows('app_settings', 1, 100);
    expect(res.rows.some((r) => r.key === 'test.key')).toBe(true);

    await DatabaseService.updateRecord('app_settings', 'key', 'test.key', { value: '456' });
    res = await DatabaseService.getTableRows('app_settings', 1, 100);
    const updated = res.rows.find((r) => r.key === 'test.key');
    expect(updated?.value).toBe('456');

    await DatabaseService.deleteRecord('app_settings', 'key', 'test.key');
    res = await DatabaseService.getTableRows('app_settings', 1, 100);
    expect(res.rows.some((r) => r.key === 'test.key')).toBe(false);
  });
});

describe('DatabaseViewer — SqlQueryEngine', () => {
  it('should execute SELECT queries with column projection and WHERE clauses', async () => {
    const result = await SqlQueryEngine.executeQuery("SELECT id, username FROM users WHERE role = 'admin'");
    expect(result.error).toBeUndefined();
    expect(result.columns).toEqual(['id', 'username']);
    expect(result.rows.length).toBe(2);
  });

  it('should execute SELECT queries with ORDER BY and LIMIT', async () => {
    const result = await SqlQueryEngine.executeQuery("SELECT * FROM processes_log ORDER BY memory_mb DESC LIMIT 3");
    expect(result.error).toBeUndefined();
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].memory_mb).toBeGreaterThanOrEqual(result.rows[1].memory_mb);
  });

  it('should return error status on invalid SQL syntax', async () => {
    const result = await SqlQueryEngine.executeQuery("INVALID SQL QUERY SYNTAX");
    expect(result.error).toBeDefined();
    expect(result.rowCount).toBe(0);
  });
});
