/**
 * @file applications/spreadsheet/components/SpreadsheetGrid.tsx
 * @description Main spreadsheet data grid with cell editing, selection range, drag interactions, and formatting display.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore.js';
import { CellModel } from '../engine/CellModel.js';
import { FormattingEngine } from '../engine/FormattingEngine.js';

export const SpreadsheetGrid: React.FC = () => {
  const workbook = useSpreadsheetStore((s) => s.workbook);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const selectionRange = useSpreadsheetStore((s) => s.selectionRange);
  const editingCell = useSpreadsheetStore((s) => s.editingCell);
  
  const selectCell = useSpreadsheetStore((s) => s.selectCell);
  const setEditingCell = useSpreadsheetStore((s) => s.setEditingCell);
  const updateCellValue = useSpreadsheetStore((s) => s.updateCellValue);
  const copySelection = useSpreadsheetStore((s) => s.copySelection);
  const pasteClipboard = useSpreadsheetStore((s) => s.pasteClipboard);
  const fillRange = useSpreadsheetStore((s) => s.fillRange);
  const resizeColumn = useSpreadsheetStore((s) => s.resizeColumn);

  const activeSheet = workbook.sheets.find((sh) => sh.id === workbook.activeSheetId) || workbook.sheets[0];
  const [inlineValue, setInlineValue] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const numRows = activeSheet?.rowCount || 50;
  const numCols = activeSheet?.colCount || 26;

  useEffect(() => {
    if (editingCell) {
      const cellId = CellModel.indicesToRef(editingCell.row, editingCell.col);
      const cellData = activeSheet?.cells[cellId];
      setInlineValue(cellData?.raw || '');
    }
  }, [editingCell, activeSheet]);

  const handleCellClick = (r: number, c: number) => {
    selectCell(r, c);
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    selectCell(r, c);
    setEditingCell({ row: r, col: c });
  };

  const currentCol = selectedCell ? selectedCell.col : 0;
  const currentRow = selectedCell ? selectedCell.row : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        updateCellValue(editingCell.row, editingCell.col, inlineValue);
        setEditingCell(null);
        selectCell(Math.min(numRows - 1, editingCell.row + 1), editingCell.col);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c' || e.key === 'C') {
        copySelection('copy');
      } else if (e.key === 'v' || e.key === 'V') {
        pasteClipboard();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        fillRange('down');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fillRange('right');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        selectCell(Math.max(0, currentRow - 1), currentCol);
        break;
      case 'ArrowDown':
        e.preventDefault();
        selectCell(Math.min(numRows - 1, currentRow + 1), currentCol);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        selectCell(currentRow, Math.max(0, currentCol - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        selectCell(currentRow, Math.min(numCols - 1, currentCol + 1));
        break;
      case 'Enter':
        e.preventDefault();
        setEditingCell({ row: currentRow, col: currentCol });
        break;
      case 'Delete':
      case 'Backspace':
        updateCellValue(currentRow, currentCol, '');
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditingCell({ row: currentRow, col: currentCol });
          setInlineValue(e.key);
        }
        break;
    }
  };

  const isCellSelected = (r: number, c: number) => {
    if (!selectionRange) return false;
    return (
      r >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
      r <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
      c >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
      c <= Math.max(selectionRange.startCol, selectionRange.endCol)
    );
  };

  const colHeaders = Array.from({ length: numCols }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div
      className="wb-spreadsheet-grid-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={gridRef}
    >
      <table className="wb-spreadsheet-table">
        <thead>
          <tr>
            <th className="wb-sp-corner-header"></th>
            {colHeaders.map((colName, c) => (
              <th
                key={colName}
                className={`wb-sp-col-header ${currentCol === c ? 'active' : ''}`}
                style={{ width: activeSheet?.columnWidths?.[c] || 100 }}
              >
                <div className="wb-sp-col-header-content">
                  <span>{colName}</span>
                  <div
                    className="wb-sp-col-resize-handle"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startWidth = activeSheet?.columnWidths?.[c] || 100;
                      const onMouseMove = (moveEv: MouseEvent) => {
                        const newW = Math.max(40, startWidth + (moveEv.clientX - startX));
                        resizeColumn(c, newW);
                      };
                      const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                      };
                      window.addEventListener('mousemove', onMouseMove);
                      window.addEventListener('mouseup', onMouseUp);
                    }}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numRows }).map((_, r) => {
            return (
              <tr key={r}>
                <td className={`wb-sp-row-header ${currentRow === r ? 'active' : ''}`}>
                  {r + 1}
                </td>
                {Array.from({ length: numCols }).map((_, c) => {
                  const cellId = CellModel.indicesToRef(r, c);
                  const cellData = activeSheet?.cells[cellId];
                  const isSelected = isCellSelected(r, c);
                  const isAnchor = currentRow === r && currentCol === c;
                  const isEditing = editingCell?.row === r && editingCell?.col === c;

                  const formattedVal = cellData ? FormattingEngine.formatDisplayValue(cellData) : '';
                  const fmt = cellData?.format || {};

                  const customStyle: React.CSSProperties = {
                    fontWeight: fmt.bold ? 'bold' : 'normal',
                    fontStyle: fmt.italic ? 'italic' : 'normal',
                    textDecoration: fmt.underline ? 'underline' : 'none',
                    textAlign: fmt.align || 'left',
                    fontSize: fmt.fontSize ? `${fmt.fontSize}px` : undefined,
                    color: fmt.textColor || undefined,
                    backgroundColor: fmt.backgroundColor || undefined,
                  };

                  return (
                    <td
                      key={cellId}
                      className={`wb-sp-cell ${isSelected ? 'selected' : ''} ${isAnchor ? 'anchor' : ''} ${cellData?.type === 'error' ? 'error' : ''}`}
                      style={customStyle}
                      onClick={() => handleCellClick(r, c)}
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          className="wb-sp-inline-input"
                          value={inlineValue}
                          onChange={(e) => setInlineValue(e.target.value)}
                          onBlur={() => {
                            updateCellValue(r, c, inlineValue);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCellValue(r, c, inlineValue);
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <div className="wb-sp-cell-content" title={cellData?.raw || ''}>
                          {formattedVal}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
