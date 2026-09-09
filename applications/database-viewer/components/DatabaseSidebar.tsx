/**
 * @file applications/database-viewer/components/DatabaseSidebar.tsx
 * @description Sidebar navigation showing databases, schemas, tables, columns, indexes, views, and saved queries.
 */

import React, { useState } from 'react';
import { useDatabaseViewerStore } from '../store/databaseViewerStore.js';

export const DatabaseSidebar: React.FC = () => {
  const databases = useDatabaseViewerStore((s) => s.databases);
  const activeDatabaseId = useDatabaseViewerStore((s) => s.activeDatabaseId);
  const activeTableName = useDatabaseViewerStore((s) => s.activeTableName);
  const savedQueries = useDatabaseViewerStore((s) => s.savedQueries);

  const setActiveDatabase = useDatabaseViewerStore((s) => s.setActiveDatabase);
  const setActiveTable = useDatabaseViewerStore((s) => s.setActiveTable);
  const executeSqlQuery = useDatabaseViewerStore((s) => s.executeSqlQuery);
  const deleteSavedQuery = useDatabaseViewerStore((s) => s.deleteSavedQuery);

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const activeDb = databases.find((d) => d.id === activeDatabaseId) || databases[0];

  const toggleTableExpand = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  return (
    <div className="wb-db-sidebar">
      <div className="wb-db-sidebar-header">
        <h3>💾 DB Explorer</h3>
        <select
          className="wb-db-select"
          value={activeDatabaseId || ''}
          onChange={(e) => setActiveDatabase(e.target.value)}
        >
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.name} ({(db.sizeBytes / 1024).toFixed(0)} KB)
            </option>
          ))}
        </select>
      </div>

      <div className="wb-db-tree-container">
        {activeDb?.schemas.map((schema) => (
          <div key={schema.name} className="wb-db-schema-group">
            <div className="wb-db-schema-header">
              <span>📁 Schema: <b>{schema.name}</b></span>
            </div>

            <div className="wb-db-tables-list">
              <div className="wb-db-section-title">TABLES ({schema.tables.length})</div>
              {schema.tables.map((table) => {
                const isSelected = activeTableName === table.name;
                const isExpanded = !!expandedTables[table.name];

                return (
                  <div key={table.name} className="wb-db-table-item-wrapper">
                    <div
                      className={`wb-db-table-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setActiveTable(table.name)}
                    >
                      <button
                        className="wb-db-expand-btn"
                        onClick={(e) => toggleTableExpand(table.name, e)}
                      >
                        {isExpanded ? '▼' : '►'}
                      </button>
                      <span className="wb-db-table-icon">📊</span>
                      <span className="wb-db-table-name">{table.name}</span>
                      <span className="wb-db-row-badge">{table.rowCount}</span>
                    </div>

                    {isExpanded && (
                      <div className="wb-db-column-tree">
                        <div className="wb-db-sub-title">Columns</div>
                        {table.columns.map((col) => (
                          <div key={col.name} className="wb-db-column-item">
                            <span className="wb-db-col-icon">
                              {col.isPrimaryKey ? '🔑' : '🔹'}
                            </span>
                            <span className="wb-db-col-name">{col.name}</span>
                            <span className="wb-db-col-type">{col.type}</span>
                          </div>
                        ))}
                        {table.indexes.length > 0 && (
                          <>
                            <div className="wb-db-sub-title">Indexes</div>
                            {table.indexes.map((idx) => (
                              <div key={idx.name} className="wb-db-index-item">
                                ⚡ {idx.name}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {schema.views.length > 0 && (
                <>
                  <div className="wb-db-section-title">VIEWS ({schema.views.length})</div>
                  {schema.views.map((view) => (
                    <div
                      key={view.name}
                      className="wb-db-view-item"
                      onClick={() => executeSqlQuery(view.sql)}
                    >
                      👁️ {view.name}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}

        <div className="wb-db-saved-queries-section">
          <div className="wb-db-section-title">SAVED QUERIES</div>
          {savedQueries.map((sq) => (
            <div key={sq.id} className="wb-db-saved-query-item">
              <span
                className="wb-db-query-title"
                title={sq.sql}
                onClick={() => executeSqlQuery(sq.sql)}
              >
                📜 {sq.title}
              </span>
              <button
                className="wb-db-del-query-btn"
                title="Delete query"
                onClick={() => deleteSavedQuery(sq.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
