/**
 * @file applications/database-viewer/components/RecordEditorModal.tsx
 * @description Modal dialog for inserting new table records or updating existing records with validation.
 */

import React, { useState, useEffect } from 'react';
import { useDatabaseViewerStore } from '../store/databaseViewerStore.js';

export const RecordEditorModal: React.FC = () => {
  const isRecordModalOpen = useDatabaseViewerStore((s) => s.isRecordModalOpen);
  const isEditingNewRecord = useDatabaseViewerStore((s) => s.isEditingNewRecord);
  const selectedRecord = useDatabaseViewerStore((s) => s.selectedRecord);
  const activeTableName = useDatabaseViewerStore((s) => s.activeTableName);
  const tableRows = useDatabaseViewerStore((s) => s.tableRows);

  const closeRecordModal = useDatabaseViewerStore((s) => s.closeRecordModal);
  const saveRecord = useDatabaseViewerStore((s) => s.saveRecord);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const columns = tableRows.length > 0 ? Object.keys(tableRows[0]) : ['id', 'name', 'value'];

  useEffect(() => {
    if (selectedRecord) {
      setFormData({ ...selectedRecord });
    } else {
      const initial: Record<string, any> = {};
      columns.forEach((c) => {
        initial[c] = '';
      });
      setFormData(initial);
    }
  }, [selectedRecord, isRecordModalOpen]);

  if (!isRecordModalOpen) return null;

  const handleFieldChange = (col: string, val: string) => {
    setFormData((prev) => ({ ...prev, [col]: val }));
  };

  const handleSave = () => {
    setValidationError(null);
    for (const col of columns) {
      if (formData[col] === undefined || formData[col] === '') {
        if (col === columns[0]) {
          setValidationError(`Primary key field '${col}' cannot be empty.`);
          return;
        }
      }
    }
    saveRecord(formData);
  };

  return (
    <div className="wb-db-modal-overlay" onClick={closeRecordModal}>
      <div className="wb-db-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-db-modal-header">
          <h3>
            {isEditingNewRecord ? '➕ Create New Record' : `✏️ Edit Record (${activeTableName})`}
          </h3>
          <button className="wb-db-modal-close" onClick={closeRecordModal}>
            ×
          </button>
        </div>

        {validationError && (
          <div className="wb-db-validation-alert">⚠️ {validationError}</div>
        )}

        <div className="wb-db-modal-body">
          {columns.map((col, idx) => (
            <div key={col} className="wb-db-field-group">
              <label>
                {col} {idx === 0 && <b className="pk-tag">(Primary Key)</b>}
              </label>
              <input
                type="text"
                value={formData[col] ?? ''}
                onChange={(e) => handleFieldChange(col, e.target.value)}
                placeholder={`Enter ${col}...`}
              />
            </div>
          ))}
        </div>

        <div className="wb-db-modal-footer">
          <button className="wb-db-btn sec" onClick={closeRecordModal}>
            Cancel
          </button>
          <button className="wb-db-btn pri" onClick={handleSave}>
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
};
