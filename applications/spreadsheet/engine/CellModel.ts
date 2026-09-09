/**
 * @file applications/spreadsheet/engine/CellModel.ts
 * @description Coordinate conversions, cell range utilities, and reference offset parsing.
 */

import type { CellSelection } from '../types.js';

export class CellModel {
  /**
   * Converts column index (0-based) to letter notation (0 -> A, 25 -> Z, 26 -> AA).
   */
  public static colToLabel(colIndex: number): string {
    let temp = colIndex;
    let label = '';
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  }

  /**
   * Converts letter notation to 0-based column index (A -> 0, Z -> 25, AA -> 26).
   */
  public static labelToCol(label: string): number {
    let col = 0;
    const clean = label.toUpperCase();
    for (let i = 0; i < clean.length; i++) {
      col = col * 26 + (clean.charCodeAt(i) - 64);
    }
    return col - 1;
  }

  /**
   * Converts row/col indices to cell coordinate string (0, 0 -> "A1").
   */
  public static toCoordinate(row: number, col: number): string {
    return `${this.colToLabel(col)}${row + 1}`;
  }

  /**
   * Parses coordinate string (e.g. "A1", "$B$5") to row/col indices.
   */
  public static parseCoordinate(coord: string): { row: number; col: number; isColAbsolute: boolean; isRowAbsolute: boolean } | null {
    const match = coord.match(/^(\$?)([A-Z]+)(\$?)([0-9]+)$/i);
    if (!match) return null;

    const isColAbs = match[1] === '$';
    const colStr = match[2]!;
    const isRowAbs = match[3] === '$';
    const rowStr = match[4]!;

    const col = this.labelToCol(colStr);
    const row = parseInt(rowStr, 10) - 1;

    if (isNaN(row) || col < 0) return null;
    return { row, col, isColAbsolute: isColAbs, isRowAbsolute: isRowAbs };
  }

  /**
   * Parses range string (e.g. "A1:C10") into CellSelection.
   */
  public static parseRange(rangeStr: string): CellSelection | null {
    const parts = rangeStr.split(':');
    if (parts.length === 1) {
      const c = this.parseCoordinate(parts[0]!);
      if (!c) return null;
      return { startRow: c.row, startCol: c.col, endRow: c.row, endCol: c.col };
    }

    if (parts.length === 2) {
      const start = this.parseCoordinate(parts[0]!);
      const end = this.parseCoordinate(parts[1]!);
      if (!start || !end) return null;

      return {
        startRow: Math.min(start.row, end.row),
        startCol: Math.min(start.col, end.col),
        endRow: Math.max(start.row, end.row),
        endCol: Math.max(start.col, end.col),
      };
    }

    return null;
  }

  /**
   * Generates list of all coordinate strings in a selection range.
   */
  public static getCoordinatesInRange(range: CellSelection): string[] {
    const coords: string[] = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        coords.push(this.toCoordinate(r, c));
      }
    }
    return coords;
  }

  public static indicesToRef(row: number, col: number): string {
    return this.toCoordinate(row, col);
  }

  public static refToIndices(ref: string): { row: number; col: number } {
    const res = this.parseCoordinate(ref);
    return res ? { row: res.row, col: res.col } : { row: 0, col: 0 };
  }

  public static parseCellRef(ref: string): { row: number; col: number } {
    return this.refToIndices(ref);
  }

  public static getCellsInRange(startRef: string, endRef: string): string[] {
    const range = this.parseRange(`${startRef}:${endRef}`);
    return range ? this.getCoordinatesInRange(range) : [];
  }
}
