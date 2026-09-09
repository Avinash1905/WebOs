import React, { useState } from 'react';
import { Database, Play, Table, Key } from 'lucide-react';
import './dbStudio.css';

interface TableSchema {
  name: string;
  columns: string[];
  rows: Record<string, any>[];
}

const INITIAL_TABLES: Record<string, TableSchema> = {
  users: {
    name: 'users',
    columns: ['id', 'username', 'email', 'role', 'created_at'],
    rows: [
      { id: 1, username: 'admin', email: 'admin@webos.local', role: 'admin', created_at: '2026-01-01' },
      { id: 2, username: 'developer', email: 'dev@webos.local', role: 'developer', created_at: '2026-01-15' },
      { id: 3, username: 'guest', email: 'guest@webos.local', role: 'user', created_at: '2026-02-01' },
    ],
  },
  processes: {
    name: 'processes',
    columns: ['pid', 'name', 'priority', 'status', 'memory_kb'],
    rows: [
      { pid: 1, name: 'init', priority: 'realtime', status: 'running', memory_kb: 4096 },
      { pid: 2, name: 'wm_compositor', priority: 'high', status: 'running', memory_kb: 16384 },
      { pid: 3, name: 'vfs_daemon', priority: 'normal', status: 'running', memory_kb: 8192 },
    ],
  },
  settings: {
    name: 'settings',
    columns: ['key', 'value', 'updated_at'],
    rows: [
      { key: 'theme', value: 'cyberpunk', updated_at: '2026-03-01' },
      { key: 'wallpaper', value: 'aurora', updated_at: '2026-03-01' },
      { key: 'density', value: 'comfortable', updated_at: '2026-03-01' },
    ],
  },
};

export const DbStudioApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [tables] = useState<Record<string, TableSchema>>(INITIAL_TABLES);
  const [activeTableName, setActiveTableName] = useState<string>('users');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users WHERE role = \'admin\';');
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const activeTable = tables[activeTableName] || tables['users'];

  const handleRunQuery = () => {
    setQueryError(null);
    const q = sqlQuery.trim().toLowerCase();

    try {
      if (q.startsWith('select * from')) {
        const parts = q.replace('select * from', '').trim().replace(';', '').split('where');
        const targetTable = parts[0].trim();

        const table = tables[targetTable];
        if (!table) {
          throw new Error(`Table '${targetTable}' does not exist.`);
        }

        if (parts.length > 1) {
          const condition = parts[1].trim(); // e.g. role = 'admin'
          const [col, val] = condition.split('=').map((s) => s.trim().replace(/'/g, ''));
          const filtered = table.rows.filter((r) => String(r[col]).toLowerCase() === val.toLowerCase());
          setQueryResults(filtered);
        } else {
          setQueryResults(table.rows);
        }
      } else {
        setQueryResults(activeTable.rows);
      }
    } catch (e: any) {
      setQueryError(e.message);
      setQueryResults(null);
    }
  };

  return (
    <div className="db-studio-container">
      {/* Sidebar Table Browser */}
      <div className="db-sidebar">
        <div className="sidebar-header">
          <Database size={15} className="text-cyan" />
          <span>PostgreSQL Studio</span>
        </div>

        <div className="tables-list">
          <div className="tables-label">Tables ({Object.keys(tables).length})</div>
          {Object.keys(tables).map((tName) => {
            const isActive = tName === activeTableName;
            return (
              <button
                key={tName}
                className={`table-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTableName(tName);
                  setSqlQuery(`SELECT * FROM ${tName};`);
                  setQueryResults(null);
                }}
              >
                <Table size={14} />
                <span>{tName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="db-main-area">
        {/* SQL Editor Area */}
        <div className="sql-editor-pane">
          <div className="sql-toolbar">
            <button className="run-sql-btn" onClick={handleRunQuery}>
              <Play size={13} />
              <span>Execute (F5)</span>
            </button>
            <span className="active-db-label">Database: webos_master</span>
          </div>
          <textarea
            className="sql-input"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Type SQL query (e.g. SELECT * FROM users;)"
          />
        </div>

        {/* Results / Table Inspector Data Grid */}
        <div className="db-results-pane">
          {queryError ? (
            <div className="db-query-error">[SQL ERROR]: {queryError}</div>
          ) : (
            <div className="db-table-wrapper">
              <table className="db-data-table">
                <thead>
                  <tr>
                    {(queryResults && queryResults.length > 0
                      ? Object.keys(queryResults[0])
                      : activeTable.columns
                    ).map((col) => (
                      <th key={col}>
                        <div className="col-th-inner">
                          {col === 'id' || col === 'pid' ? <Key size={11} className="text-amber" /> : null}
                          <span>{col}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(queryResults || activeTable.rows).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {(queryResults && queryResults.length > 0
                        ? Object.keys(queryResults[0])
                        : activeTable.columns
                      ).map((col) => (
                        <td key={col}>{String(row[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
