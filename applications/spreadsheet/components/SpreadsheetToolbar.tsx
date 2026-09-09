/**
 * @file applications/spreadsheet/components/SpreadsheetToolbar.tsx
 * @description Toolbar component providing cell formatting, formula insertion, chart creation, and file actions.
 */

import React from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';
import type { CellFormat } from '../types.js';

export const SpreadsheetToolbar: React.FC = () => {
  const workbook = useSpreadsheetStore((s) => s.workbook);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const undoStack = useSpreadsheetStore((s) => s.undoStack);
  const redoStack = useSpreadsheetStore((s) => s.redoStack);
  
  const updateCellFormat = useSpreadsheetStore((s) => s.updateCellFormat);
  const toggleChartModal = useSpreadsheetStore((s) => s.toggleChartModal);
  const toggleFilterModal = useSpreadsheetStore((s) => s.toggleFilterModal);
  const undo = useSpreadsheetStore((s) => s.undo);
  const redo = useSpreadsheetStore((s) => s.redo);
  const sortSelectedRange = useSpreadsheetStore((s) => s.sortSelectedRange);
  const createWorkbook = useSpreadsheetStore((s) => s.createWorkbook);
  const saveWorkbook = useSpreadsheetStore((s) => s.saveWorkbook);

  const activeSheet = workbook.sheets.find((sh) => sh.id === workbook.activeSheetId) || workbook.sheets[0];
  const colIndex = selectedCell ? selectedCell.col : 0;
  const rowIndex = selectedCell ? selectedCell.row : 0;
  const colName = String.fromCharCode(65 + colIndex);
  const cellId = `${colName}${rowIndex + 1}`;
  const cellData = activeSheet?.cells[cellId];
  const currentFmt: CellFormat = cellData?.format || {};

  const toggleBold = () => updateCellFormat({ bold: !currentFmt.bold });
  const toggleItalic = () => updateCellFormat({ italic: !currentFmt.italic });
  const toggleUnderline = () => updateCellFormat({ underline: !currentFmt.underline });

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    updateCellFormat({ align });
  };

  const handleNumFmt = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateCellFormat({ numberFormat: e.target.value as any });
  };

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateCellFormat({ fontSize: parseInt(e.target.value, 10) });
  };

  const handleBgColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCellFormat({ backgroundColor: e.target.value });
  };

  const handleTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCellFormat({ textColor: e.target.value });
  };

  return (
    <div className="wb-spreadsheet-toolbar">
      <div className="wb-spreadsheet-toolbar-group">
        <button className="wb-sp-btn" title="New Workbook" onClick={() => createWorkbook()}>
          📄 New
        </button>
        <button className="wb-sp-btn" title="Save Workbook" onClick={saveWorkbook}>
          💾 Save
        </button>
        <div className="wb-sp-divider" />
        <button className="wb-sp-btn" title="Undo (Ctrl+Z)" disabled={undoStack.length === 0} onClick={undo}>
          ↩️
        </button>
        <button className="wb-sp-btn" title="Redo (Ctrl+Y)" disabled={redoStack.length === 0} onClick={redo}>
          ↪️
        </button>
      </div>

      <div className="wb-sp-divider" />

      <div className="wb-spreadsheet-toolbar-group">
        <select
          className="wb-sp-select"
          value={currentFmt.fontSize || 12}
          onChange={handleFontSize}
          title="Font Size"
        >
          <option value={10}>10 pt</option>
          <option value={12}>12 pt</option>
          <option value={14}>14 pt</option>
          <option value={16}>16 pt</option>
          <option value={18}>18 pt</option>
          <option value={20}>20 pt</option>
        </select>

        <button
          className={`wb-sp-btn ${currentFmt.bold ? 'active' : ''}`}
          title="Bold"
          onClick={toggleBold}
        >
          <b>B</b>
        </button>
        <button
          className={`wb-sp-btn ${currentFmt.italic ? 'active' : ''}`}
          title="Italic"
          onClick={toggleItalic}
        >
          <i>I</i>
        </button>
        <button
          className={`wb-sp-btn ${currentFmt.underline ? 'active' : ''}`}
          title="Underline"
          onClick={toggleUnderline}
        >
          <u>U</u>
        </button>
      </div>

      <div className="wb-sp-divider" />

      <div className="wb-spreadsheet-toolbar-group">
        <button
          className={`wb-sp-btn ${currentFmt.align === 'left' ? 'active' : ''}`}
          title="Align Left"
          onClick={() => handleAlign('left')}
        >
          ⬅️
        </button>
        <button
          className={`wb-sp-btn ${currentFmt.align === 'center' ? 'active' : ''}`}
          title="Align Center"
          onClick={() => handleAlign('center')}
        >
          ↔️
        </button>
        <button
          className={`wb-sp-btn ${currentFmt.align === 'right' ? 'active' : ''}`}
          title="Align Right"
          onClick={() => handleAlign('right')}
        >
          ➡️
        </button>
      </div>

      <div className="wb-sp-divider" />

      <div className="wb-spreadsheet-toolbar-group">
        <label className="wb-sp-color-picker" title="Text Color">
          🎨
          <input
            type="color"
            value={currentFmt.textColor || '#ffffff'}
            onChange={handleTextColor}
          />
        </label>

        <label className="wb-sp-color-picker" title="Fill Color">
          🪣
          <input
            type="color"
            value={currentFmt.backgroundColor || '#1e293b'}
            onChange={handleBgColor}
          />
        </label>

        <select
          className="wb-sp-select"
          value={currentFmt.numberFormat || 'general'}
          onChange={handleNumFmt}
          title="Number Formatting"
        >
          <option value="general">General</option>
          <option value="number">Number (1,000.00)</option>
          <option value="currency">Currency ($)</option>
          <option value="percentage">Percent (%)</option>
          <option value="date">Date</option>
        </select>
      </div>

      <div className="wb-sp-divider" />

      <div className="wb-spreadsheet-toolbar-group">
        <button className="wb-sp-btn" title="Sort Ascending" onClick={() => sortSelectedRange(colIndex, true)}>
          ▲ Sort
        </button>
        <button className="wb-sp-btn" title="Sort Descending" onClick={() => sortSelectedRange(colIndex, false)}>
          ▼ Sort
        </button>
        <button className="wb-sp-btn" title="Filter Selection" onClick={() => toggleFilterModal(true)}>
          🔍 Filter
        </button>
        <button className="wb-sp-btn highlight" title="Insert Chart" onClick={() => toggleChartModal(true)}>
          📊 Chart
        </button>
      </div>
    </div>
  );
};
