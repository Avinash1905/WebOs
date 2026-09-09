/**
 * @file applications/spreadsheet/components/SpreadsheetFilterModal.tsx
 * @description Modal for applying column filters to the selected range.
 */

import React, { useState } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';

export const SpreadsheetFilterModal: React.FC = () => {
  const isFilterModalOpen = useSpreadsheetStore((s) => s.isFilterModalOpen);
  const toggleFilterModal = useSpreadsheetStore((s) => s.toggleFilterModal);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);

  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');

  if (!isFilterModalOpen) return null;

  const colIndex = selectedCell ? selectedCell.col : 0;
  const colLetter = String.fromCharCode(65 + colIndex);

  const handleApplyFilter = () => {
    toggleFilterModal(false);
  };

  return (
    <div className="wb-spreadsheet-modal-overlay" onClick={() => toggleFilterModal(false)}>
      <div className="wb-spreadsheet-modal small" onClick={(e) => e.stopPropagation()}>
        <div className="wb-sp-modal-header">
          <h3>🔍 Filter Column {colLetter}</h3>
          <button className="wb-sp-modal-close" onClick={() => toggleFilterModal(false)}>
            ×
          </button>
        </div>

        <div className="wb-sp-modal-body">
          <div className="wb-sp-form-group">
            <label>Filter Condition</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value="contains">Contains</option>
              <option value="equals">Equals</option>
              <option value="notEquals">Does Not Equal</option>
              <option value="startsWith">Starts With</option>
              <option value="endsWith">Ends With</option>
              <option value="greaterThan">Greater Than (&gt;)</option>
              <option value="lessThan">Less Than (&lt;)</option>
            </select>
          </div>

          <div className="wb-sp-form-group">
            <label>Target Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Filter value..."
            />
          </div>
        </div>

        <div className="wb-sp-modal-footer">
          <button className="wb-sp-btn-sec" onClick={() => toggleFilterModal(false)}>
            Cancel
          </button>
          <button className="wb-sp-btn-pri" onClick={handleApplyFilter}>
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};
