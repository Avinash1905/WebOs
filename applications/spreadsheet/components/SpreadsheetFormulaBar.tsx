/**
 * @file applications/spreadsheet/components/SpreadsheetFormulaBar.tsx
 * @description Formula bar component for inspecting and editing cell formulas and values.
 */

import React from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';
import { CellModel } from '../engine/CellModel.js';

export const SpreadsheetFormulaBar: React.FC = () => {
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const formulaBuffer = useSpreadsheetStore((s) => s.formulaBuffer);
  const setFormulaBuffer = useSpreadsheetStore((s) => s.setFormulaBuffer);
  const updateCellValue = useSpreadsheetStore((s) => s.updateCellValue);

  const colIndex = selectedCell ? selectedCell.col : 0;
  const rowIndex = selectedCell ? selectedCell.row : 0;
  const cellRefLabel = CellModel.indicesToRef(rowIndex, colIndex);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateCellValue(rowIndex, colIndex, formulaBuffer);
    }
  };

  const handleBlur = () => {
    updateCellValue(rowIndex, colIndex, formulaBuffer);
  };

  return (
    <div className="wb-spreadsheet-formulabar">
      <div className="wb-sp-cell-ref" title="Selected Cell Reference">
        {cellRefLabel}
      </div>

      <div className="wb-sp-fx-symbol" title="Formula Engine">
        <i>fx</i>
      </div>

      <input
        type="text"
        className="wb-sp-formula-input"
        value={formulaBuffer}
        onChange={(e) => setFormulaBuffer(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Type text, number, or formula (e.g., =SUM(A1:A10))"
      />
    </div>
  );
};
