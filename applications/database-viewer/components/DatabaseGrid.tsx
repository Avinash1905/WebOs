/**
 * @file applications/database-viewer/components/DatabaseGrid.tsx
 * @description Interactive data grid for database records with pagination, sorting, filtering, and record editing.
 */

import React from 'react';
import { useDatabaseViewerStore } from '../store/databaseViewerStore.js';

export const DatabaseGrid: React.FC = () => {
  const activeTableName = useDatabaseViewerStore((s) => s.activeTableName);
  const tableRows = useDatabaseViewerStore((s) => s.tableRows);
  const totalRows = useDatabaseViewerStore((s) => s.totalRows);
  const currentPage = useDatabaseViewerStore((s) => s.currentPage);
  const pageSize = useDatabaseViewerStore((s) => s.pageSize);
  const sortColumn = useDatabaseViewerStore((s) => s.sortColumn);
  const sortDirection = useDatabaseViewerStore((s) => s.sortDirection);
  const filterQuery = useDatabaseViewerStore((s) => s.filterQuery);

  const setPage = useDatabaseViewerStore((s) => s.setPage);
  const setPageSize = useDatabaseViewerStore((s) => s.setPageSize);
  const setSort = useDatabaseViewerStore((s) => s.setSort);
  const setFilterQuery = useDatabaseViewerStore((s) => s.setFilterQuery);
  const openNewRecordModal = useDatabaseViewerStore((s) => s.openNewRecordModal);
  const openEditRecordModal = useDatabaseViewerStore((s) => s.openEditRecordModal);
  const deleteRecord = useDatabaseViewerStore((s) => s.deleteRecord);
  const refreshDatabase = useDatabaseViewerStore((s) => s.refreshDatabase);

  if (!activeTableName) {
    return (
      <div className="wb-db-empty-state">
        <div className="wb-db-empty-icon">🗄️</div>
        <h3>No Table Selected</h3>
        <p>Select a table from the left explorer sidebar to view and manage data records.</p>
      </div>
    );
  }

  const columns = tableRows.length > 0 ? Object.keys(tableRows[0]) : [];
  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  const handleDelete = (row: Record<string, any>) => {
    const pkVal = row[columns[0]];
    if (confirm(`Are you sure you want to delete record ${columns[0]} = '${pkVal}'?`)) {
      deleteRecord(pkVal);
    }
  };

  return (
    <div className="wb-db-grid-wrapper">
      <div className="wb-db-grid-toolbar">
        <div className="wb-db-grid-title">
          <span>Table: <b>{activeTableName}</b></span>
          <span className="wb-db-count-tag">{totalRows} records</span>
        </div>

        <div className="wb-db-search-box">
          <input
            type="text"
            placeholder="Filter table rows..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <div className="wb-db-grid-actions">
          <button className="wb-db-btn pri" onClick={openNewRecordModal}>
            ➕ New Record
          </button>
          <button className="wb-db-btn sec" onClick={() => refreshDatabase()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="wb-db-table-scroll">
        <table className="wb-db-table">
          <thead>
            <tr>
              <th className="wb-db-action-th">Actions</th>
              {columns.map((col) => (
                <th key={col} onClick={() => setSort(col)}>
                  <div className="wb-db-th-content">
                    <span>{col}</span>
                    {sortColumn === col && (
                      <span className="wb-db-sort-icon">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="wb-db-no-records">
                  No matching records found.
                </td>
              </tr>
            ) : (
              tableRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="wb-db-action-td">
                    <button
                      className="wb-db-row-btn edit"
                      title="Edit Record"
                      onClick={() => openEditRecordModal(row)}
                    >
                      ✏️
                    </button>
                    <button
                      className="wb-db-row-btn del"
                      title="Delete Record"
                      onClick={() => handleDelete(row)}
                    >
                      🗑️
                    </button>
                  </td>
                  {columns.map((col) => (
                    <td key={col}>
                      <span className="wb-db-cell-text">
                        {String(row[col] ?? 'NULL')}
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="wb-db-pagination-bar">
        <div className="wb-db-page-size-selector">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="wb-db-page-controls">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ◀ Previous
          </button>
          <span>
            Page <b>{currentPage}</b> of <b>{totalPages}</b>
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
