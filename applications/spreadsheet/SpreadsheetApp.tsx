import React, { useState } from 'react';
import { Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import './spreadsheet.css';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const NUM_ROWS = 20;

export const SpreadsheetApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [data, setData] = useState<Record<string, string>>({
    A1: 'Item', B1: 'Quantity', C1: 'Price', D1: 'Total',
    A2: 'SSD Storage', B2: '5', C2: '120', D2: '=B2*C2',
    A3: 'RAM Module', B3: '8', C3: '65', D3: '=B3*C3',
    A4: 'GPU Card', B4: '2', C4: '650', D4: '=B4*C4',
    A5: 'Total Sum', D5: '=SUM(D2:D4)',
  });

  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaInput, setFormulaInput] = useState<string>('Item');

  const evaluateFormula = (val: string): string => {
    if (!val.startsWith('=')) return val;
    const expr = val.substring(1).trim().toUpperCase();

    // SUM(D2:D4)
    const sumMatch = expr.match(/SUM\(([A-H])(\d+):([A-H])(\d+)\)/);
    if (sumMatch) {
      const col = sumMatch[1];
      const startRow = parseInt(sumMatch[2], 10);
      const endRow = parseInt(sumMatch[4], 10);
      let sum = 0;
      for (let r = startRow; r <= endRow; r++) {
        const cellVal = parseFloat(evaluateFormula(data[`${col}${r}`] || '0'));
        if (!isNaN(cellVal)) sum += cellVal;
      }
      return String(sum);
    }

    // Direct cell multiplication or math like =B2*C2
    try {
      const replaced = expr.replace(/([A-H])(\d+)/g, (_, c, r) => {
        const targetRaw = data[`${c}${r}`] || '0';
        return evaluateFormula(targetRaw);
      });
      // Evaluate sanitized safe math
      const sanitized = replaced.replace(/[^0-9+\-*/().]/g, '');
      const evaluated = new Function(`return ${sanitized}`)();
      return String(Number(evaluated.toFixed(2)));
    } catch {
      return '#VALUE!';
    }
  };

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    setFormulaInput(data[cellId] || '');
  };

  const handleCellChange = (cellId: string, val: string) => {
    setData((prev) => ({ ...prev, [cellId]: val }));
    setFormulaInput(val);
  };

  const handleFormulaCommit = () => {
    if (selectedCell) {
      setData((prev) => ({ ...prev, [selectedCell]: formulaInput }));
    }
  };

  const handleExportCsv = () => {
    let csv = '';
    for (let r = 1; r <= NUM_ROWS; r++) {
      const rowVals = COLS.map((col) => {
        const raw = data[`${col}${r}`] || '';
        const evaluated = evaluateFormula(raw);
        return `"${evaluated.replace(/"/g, '""')}"`;
      });
      csv += rowVals.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webcalc_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="spreadsheet-container">
      {/* Top Toolbar */}
      <div className="sheet-toolbar">
        <div className="sheet-title">
          <FileSpreadsheet size={16} className="text-emerald" />
          <span>WebCalc Studio</span>
        </div>

        <div className="sheet-actions">
          <button className="sheet-btn" onClick={handleExportCsv}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button className="sheet-btn danger" onClick={() => setData({})}>
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="sheet-formula-bar">
        <div className="selected-cell-id">{selectedCell}</div>
        <span className="fx-label">fx</span>
        <input
          type="text"
          className="formula-input"
          value={formulaInput}
          onChange={(e) => setFormulaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFormulaCommit();
          }}
          placeholder="Enter text or formula (e.g. =SUM(B2:B5), =B2*C2)"
        />
      </div>

      {/* Grid Canvas */}
      <div className="sheet-grid-wrapper">
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="corner-th">#</th>
              {COLS.map((col) => (
                <th key={col} className="col-header">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NUM_ROWS }, (_, i) => i + 1).map((row) => (
              <tr key={row}>
                <td className="row-header">{row}</td>
                {COLS.map((col) => {
                  const cellId = `${col}${row}`;
                  const isSelected = selectedCell === cellId;
                  const rawVal = data[cellId] || '';
                  const displayVal = evaluateFormula(rawVal);

                  return (
                    <td
                      key={cellId}
                      className={`sheet-cell ${isSelected ? 'active' : ''}`}
                      onClick={() => handleCellClick(cellId)}
                    >
                      <input
                        type="text"
                        value={isSelected ? formulaInput : displayVal}
                        onChange={(e) => handleCellChange(cellId, e.target.value)}
                        onFocus={() => handleCellClick(cellId)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
