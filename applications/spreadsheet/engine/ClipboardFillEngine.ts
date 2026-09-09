/**
 * @file applications/spreadsheet/engine/ClipboardFillEngine.ts
 * @description Relative/absolute formula propagation, range copy/paste, and series fill operations.
 */

import { CellModel } from './CellModel.js';
import type { CellMap, CellSelection } from '../types.js';

export class ClipboardFillEngine {
  /**
   * Adjusts relative cell references in a formula string by row/col offsets.
   */
  public static adjustFormula(formula: string, rowOffset: number, colOffset: number): string {
    if (!formula.startsWith('=')) return formula;

    return formula.replace(/\b(\$?[A-Z]+\$?[0-9]+)\b/gi, (match) => {
      const parsed = CellModel.parseCoordinate(match);
      if (!parsed) return match;

      const newCol = parsed.isColAbsolute ? parsed.col : parsed.col + colOffset;
      const newRow = parsed.isRowAbsolute ? parsed.row : parsed.row + rowOffset;

      if (newCol < 0 || newRow < 0) return '#REF!';

      const colPart = parsed.isColAbsolute ? `$${CellModel.colToLabel(newCol)}` : CellModel.colToLabel(newCol);
      const rowPart = parsed.isRowAbsolute ? `$${newRow + 1}` : `${newRow + 1}`;

      return `${colPart}${rowPart}`;
    });
  }

  /**
   * Pastes source cell range onto target top-left cell.
   */
  public static pasteRange(
    sourceMap: CellMap,
    sourceRange: CellSelection,
    targetRow: number,
    targetCol: number
  ): CellMap {
    const updatedMap: CellMap = { ...sourceMap };
    const rowOffset = targetRow - sourceRange.startRow;
    const colOffset = targetCol - sourceRange.startCol;

    for (let r = sourceRange.startRow; r <= sourceRange.endRow; r++) {
      for (let c = sourceRange.startCol; c <= sourceRange.endCol; c++) {
        const srcCoord = CellModel.toCoordinate(r, c);
        const destCoord = CellModel.toCoordinate(r + rowOffset, c + colOffset);
        const srcCell = sourceMap[srcCoord];

        if (srcCell) {
          const newRaw = srcCell.raw.startsWith('=')
            ? this.adjustFormula(srcCell.raw, rowOffset, colOffset)
            : srcCell.raw;

          updatedMap[destCoord] = {
            ...srcCell,
            raw: newRaw,
          };
        }
      }
    }

    return updatedMap;
  }

  /**
   * Fills a target selection range based on the top-left source values.
   */
  public static fillSeries(cellMap: CellMap, selection: CellSelection, direction: 'down' | 'up' | 'left' | 'right'): CellMap {
    const updatedMap: CellMap = { ...cellMap };

    if (direction === 'down') {
      const srcRow = selection.startRow;
      for (let c = selection.startCol; c <= selection.endCol; c++) {
        const srcCoord = CellModel.toCoordinate(srcRow, c);
        const srcCell = cellMap[srcCoord];
        if (!srcCell) continue;

        for (let r = selection.startRow + 1; r <= selection.endRow; r++) {
          const rowOffset = r - srcRow;
          const destCoord = CellModel.toCoordinate(r, c);
          const newRaw = srcCell.raw.startsWith('=')
            ? this.adjustFormula(srcCell.raw, rowOffset, 0)
            : !isNaN(Number(srcCell.raw))
            ? String(Number(srcCell.raw) + rowOffset)
            : srcCell.raw;

          updatedMap[destCoord] = { ...srcCell, raw: newRaw };
        }
      }
    }

    return updatedMap;
  }
}
