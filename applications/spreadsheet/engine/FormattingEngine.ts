/**
 * @file applications/spreadsheet/engine/FormattingEngine.ts
 * @description Number formatting, currency, percentage, date, and visual cell formatting.
 */

import type { CellData, CellFormat } from '../types.js';

export class FormattingEngine {
  /**
   * Formats computed cell value according to CellFormat rules.
   */
  public static formatDisplayValue(cell: CellData | undefined): string {
    if (!cell) return '';

    const val = cell.computed !== undefined ? cell.computed : cell.raw;
    if (val === null || val === undefined) return '';

    const format: CellFormat = cell.format || {};
    const numFormat = format.numberFormat || 'general';
    const decimals = format.decimalPlaces !== undefined ? format.decimalPlaces : 2;

    if (cell.type === 'error' || String(val).startsWith('#')) {
      return String(val);
    }

    if (numFormat === 'currency' && !isNaN(Number(val))) {
      return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    if (numFormat === 'percentage' && !isNaN(Number(val))) {
      return `${(Number(val) * 100).toFixed(decimals)}%`;
    }

    if (numFormat === 'number' && !isNaN(Number(val))) {
      return Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    if (numFormat === 'date' && (typeof val === 'string' || typeof val === 'number')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString();
      }
    }

    return String(val);
  }
}
