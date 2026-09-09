/**
 * @file applications/spreadsheet/engine/SortFilterEngine.ts
 * @description Multi-column sorting & filtering engine for spreadsheet ranges.
 */

import { CellModel } from './CellModel.js';
import type { CellMap, CellSelection } from '../types.js';

export class SortFilterEngine {
  /**
   * Sorts rows within a selection range based on target column index.
   */
  public static sortRange(
    cellMap: CellMap,
    range: CellSelection,
    targetCol: number,
    ascending = true
  ): CellMap {
    const updatedMap: CellMap = { ...cellMap };

    // Extract row data
    const rowList: { rowIndex: number; sortVal: any; cells: Record<number, any> }[] = [];

    for (let r = range.startRow; r <= range.endRow; r++) {
      const rowCells: Record<number, any> = {};
      let sortVal: any = '';

      for (let c = range.startCol; c <= range.endCol; c++) {
        const coord = CellModel.toCoordinate(r, c);
        const cell = cellMap[coord];
        rowCells[c] = cell;

        if (c === targetCol && cell) {
          sortVal = cell.computed !== undefined ? cell.computed : cell.raw;
        }
      }

      rowList.push({ rowIndex: r, sortVal, cells: rowCells });
    }

    // Sort rowList
    rowList.sort((a, b) => {
      let cmp = 0;
      const vA = a.sortVal;
      const vB = b.sortVal;

      if (!isNaN(Number(vA)) && !isNaN(Number(vB))) {
        cmp = Number(vA) - Number(vB);
      } else {
        cmp = String(vA).localeCompare(String(vB));
      }

      return ascending ? cmp : -cmp;
    });

    // Write back sorted rows into target range
    rowList.forEach((rowObj, targetIdx) => {
      const destRow = range.startRow + targetIdx;
      for (let c = range.startCol; c <= range.endCol; c++) {
        const destCoord = CellModel.toCoordinate(destRow, c);
        const cellData = rowObj.cells[c];
        if (cellData) {
          updatedMap[destCoord] = { ...cellData };
        } else {
          delete updatedMap[destCoord];
        }
      }
    });

    return updatedMap;
  }
}
