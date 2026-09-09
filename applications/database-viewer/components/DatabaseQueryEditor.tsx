/**
 * @file applications/database-viewer/components/DatabaseQueryEditor.tsx
 * @description Interactive SQL Query Editor with execution status, query history, and result grid display.
 */

import React, { useState } from 'react';
import { useDatabaseViewerStore } from '../store/databaseViewerStore.js';

export const DatabaseQueryEditor: React.FC = () => {
  const activeQuerySql = useDatabaseViewerStore((s) => s.activeQuerySql);
  const queryStatus = useDatabaseViewerStore((s) => s.queryStatus);
  const queryResult = useDatabaseViewerStore((s) => s.queryResult);
  const queryHistory = useDatabaseViewerStore((s) => s.queryHistory);

  const executeSqlQuery = useDatabaseViewerStore((s) => s.executeSqlQuery);
  const saveQuery = useDatabaseViewerStore((s) => s.saveQuery);

  const [sqlBuffer, setSqlBuffer] = useState(activeQuerySql);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleExecute = () => {
    executeSqlQuery(sqlBuffer);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleSaveQuery = () => {
    if (saveTitle.trim()) {
      saveQuery(saveTitle.trim(), sqlBuffer);
      setSaveTitle('');
      setIsSaving(false);
    }
  };

  return (
    <div className="wb-db-query-editor-wrapper">
      <div className="wb-db-query-controls">
        <div className="wb-db-query-title-bar">
          <span>⚡ SQL Query Console</span>
          <select
            className="wb-db-history-select"
            onChange={(e) => {
              setSqlBuffer(e.target.value);
            }}
            value=""
          >
            <option value="" disabled>
              📜 Select recent query...
            </option>
            {queryHistory.map((q, idx) => (
              <option key={idx} value={q}>
                {q.length > 50 ? q.slice(0, 50) + '...' : q}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="wb-db-sql-textarea"
          value={sqlBuffer}
          onChange={(e) => setSqlBuffer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type SQL query (e.g. SELECT * FROM users WHERE role = 'admin';)"
        />

        <div className="wb-db-query-actions">
          <button
            className="wb-db-btn pri"
            disabled={queryStatus === 'running'}
            onClick={handleExecute}
          >
            ▶ Run Query (Ctrl+Enter)
          </button>

          {isSaving ? (
            <div className="wb-db-save-input-group">
              <input
                type="text"
                placeholder="Query Name..."
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
              <button className="wb-db-btn sec" onClick={handleSaveQuery}>
                Confirm
              </button>
              <button className="wb-db-btn cancel" onClick={() => setIsSaving(false)}>
                ×
              </button>
            </div>
          ) : (
            <button className="wb-db-btn sec" onClick={() => setIsSaving(true)}>
              ⭐ Save Query
            </button>
          )}

          <div className="wb-db-query-status-badge">
            Status: <span className={`status ${queryStatus}`}>{queryStatus.toUpperCase()}</span>
            {queryResult && (
              <span className="execution-time">({queryResult.executionTimeMs} ms)</span>
            )}
          </div>
        </div>
      </div>

      <div className="wb-db-query-results-area">
        {queryResult?.error ? (
          <div className="wb-db-query-error">
            ⚠️ <b>Query Failure:</b> {queryResult.error}
          </div>
        ) : queryResult && queryResult.rows ? (
          <div className="wb-db-results-grid">
            <div className="wb-db-results-header">
              <span>Results: <b>{queryResult.rowCount}</b> rows returned</span>
            </div>

            <div className="wb-db-table-scroll">
              <table className="wb-db-table">
                <thead>
                  <tr>
                    {queryResult.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {queryResult.columns.map((col) => (
                        <td key={col}>{String(row[col] ?? 'NULL')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="wb-db-no-results">
            Run a SQL query above to view the dataset results.
          </div>
        )}
      </div>
    </div>
  );
};
