/**
 * @file applications/spreadsheet/components/SpreadsheetSheetBar.tsx
 * @description Bottom tab bar for navigating, creating, renaming, and reordering multiple sheets.
 */

import React, { useState } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';
import { CellModel } from '../engine/CellModel.js';

export const SpreadsheetSheetBar: React.FC = () => {
  const workbook = useSpreadsheetStore((s) => s.workbook);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);

  const addSheet = useSpreadsheetStore((s) => s.addSheet);
  const setActiveSheet = useSpreadsheetStore((s) => s.setActiveSheet);
  const renameSheet = useSpreadsheetStore((s) => s.renameSheet);
  const deleteSheet = useSpreadsheetStore((s) => s.deleteSheet);

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeSheet = workbook.sheets.find((sh) => sh.id === workbook.activeSheetId) || workbook.sheets[0];
  const colIndex = selectedCell ? selectedCell.col : 0;
  const rowIndex = selectedCell ? selectedCell.row : 0;
  const cellRef = CellModel.indicesToRef(rowIndex, colIndex);

  const handleStartRename = (id: string, name: string) => {
    setEditingSheetId(id);
    setRenameValue(name);
  };

  const handleFinishRename = (id: string) => {
    if (renameValue.trim()) {
      renameSheet(id, renameValue.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <div className="wb-spreadsheet-sheetbar">
      <div className="wb-sp-sheet-tabs">
        <button
          className="wb-sp-add-sheet-btn"
          title="Add Sheet"
          onClick={() => addSheet()}
        >
          ➕
        </button>

        {workbook.sheets.map((sheet) => {
          const isActive = sheet.id === workbook.activeSheetId;
          const isEditing = editingSheetId === sheet.id;

          return (
            <div
              key={sheet.id}
              className={`wb-sp-sheet-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSheet(sheet.id)}
              onDoubleClick={() => handleStartRename(sheet.id, sheet.name)}
            >
              {isEditing ? (
                <input
                  autoFocus
                  className="wb-sp-sheet-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleFinishRename(sheet.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename(sheet.id);
                  }}
                />
              ) : (
                <span className="wb-sp-sheet-name">{sheet.name}</span>
              )}

              {workbook.sheets.length > 1 && (
                <button
                  className="wb-sp-delete-sheet-btn"
                  title="Delete Sheet"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete sheet '${sheet.name}'?`)) {
                      deleteSheet(sheet.id);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="wb-sp-statusbar-info">
        <span className="wb-sp-status-item">Cell: <b>{cellRef}</b></span>
        <span className="wb-sp-status-item">Sheets: <b>{workbook.sheets.length}</b></span>
        <span className="wb-sp-status-item">Status: <b>READY</b></span>
      </div>
    </div>
  );
};
