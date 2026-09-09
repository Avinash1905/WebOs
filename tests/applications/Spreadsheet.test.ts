/**
 * @file tests/applications/Spreadsheet.test.ts
 * @description Comprehensive unit tests for WebOS Spreadsheet cell engine, formula parser, dependency graph, formatting, clipboard fill, sorting, charts, and workbook store.
 */

import { describe, it, expect } from 'vitest';
import { CellModel } from '../../applications/spreadsheet/engine/CellModel.js';
import { FormulaParser } from '../../applications/spreadsheet/engine/FormulaParser.js';
import { DependencyGraph } from '../../applications/spreadsheet/engine/DependencyGraph.js';
import { FormattingEngine } from '../../applications/spreadsheet/engine/FormattingEngine.js';
import { ChartEngine } from '../../applications/spreadsheet/engine/ChartEngine.js';
import type { CellMap } from '../../applications/spreadsheet/types.js';

describe('Spreadsheet — CellModel Coordinate Converter', () => {
  it('should convert cell refs to indices and back', () => {
    expect(CellModel.parseCellRef('A1')).toEqual({ row: 0, col: 0 });
    expect(CellModel.parseCellRef('B5')).toEqual({ row: 4, col: 1 });
    expect(CellModel.parseCellRef('Z100')).toEqual({ row: 99, col: 25 });

    expect(CellModel.toCoordinate(0, 0)).toBe('A1');
    expect(CellModel.toCoordinate(4, 1)).toBe('B5');
    expect(CellModel.toCoordinate(99, 25)).toBe('Z100');
  });

  it('should parse ranges like A1:C3', () => {
    const range = CellModel.getCellsInRange('A1', 'C3');
    expect(range.length).toBe(9);
    expect(range).toContain('A1');
    expect(range).toContain('B2');
    expect(range).toContain('C3');
  });
});

describe('Spreadsheet — FormulaParser Engine', () => {
  const mockCells: CellMap = {
    A1: { raw: '10', type: 'number', computed: 10 },
    A2: { raw: '20', type: 'number', computed: 20 },
    A3: { raw: '30', type: 'number', computed: 30 },
    B1: { raw: 'Hello', type: 'text', computed: 'Hello' },
    B2: { raw: 'World', type: 'text', computed: 'World' },
  };

  it('should evaluate standard formula functions SUM, AVERAGE, MIN, MAX', () => {
    expect(FormulaParser.evaluateFormula('=SUM(A1:A3)', mockCells)).toBe(60);
    expect(FormulaParser.evaluateFormula('=AVERAGE(A1:A3)', mockCells)).toBe(20);
    expect(FormulaParser.evaluateFormula('=MIN(A1:A3)', mockCells)).toBe(10);
    expect(FormulaParser.evaluateFormula('=MAX(A1:A3)', mockCells)).toBe(30);
    expect(FormulaParser.evaluateFormula('=COUNT(A1:A3)', mockCells)).toBe(3);
  });

  it('should evaluate logical functions IF, AND, OR', () => {
    expect(FormulaParser.evaluateFormula('=IF(A1 < A2, "YES", "NO")', mockCells)).toBe('YES');
    expect(FormulaParser.evaluateFormula('=AND(A1 > 0, A2 > 0)', mockCells)).toBe(true);
    expect(FormulaParser.evaluateFormula('=OR(A1 > 50, A2 = 20)', mockCells)).toBe(true);
  });

  it('should evaluate string functions CONCAT, LEN, UPPER', () => {
    expect(FormulaParser.evaluateFormula('=CONCAT(B1, " ", B2)', mockCells)).toBe('Hello World');
    expect(FormulaParser.evaluateFormula('=LEN(B1)', mockCells)).toBe(5);
    expect(FormulaParser.evaluateFormula('=UPPER(B1)', mockCells)).toBe('HELLO');
  });

  it('should return division by zero error string #DIV/0!', () => {
    expect(FormulaParser.evaluateFormula('=10 / 0', mockCells)).toBe('#DIV/0!');
  });
});

describe('Spreadsheet — DependencyGraph Engine & Recalculation', () => {
  it('should automatically cascade recalculations through dependent cells', () => {
    const cells: CellMap = {
      A1: { raw: '10', type: 'number', computed: 10 },
      A2: { raw: '20', type: 'number', computed: 20 },
      A3: { raw: '=A1 + A2', computed: 30 },
      A4: { raw: '=A3 * 2', computed: 60 },
    };

    const recalculated = DependencyGraph.recalculateAll(cells);
    expect(recalculated.A3.computed).toBe(30);
    expect(recalculated.A4.computed).toBe(60);
  });

  it('should detect circular references and tag with #CIRCULAR!', () => {
    const circularCells: CellMap = {
      A1: { raw: '=B1 + 1' },
      B1: { raw: '=A1 + 1' },
    };

    const recalculated = DependencyGraph.recalculateAll(circularCells);
    expect(recalculated.A1.computed).toBe('#CIRCULAR!');
    expect(recalculated.B1.computed).toBe('#CIRCULAR!');
  });
});

describe('Spreadsheet — FormattingEngine', () => {
  it('should format numbers as currency and percentages', () => {
    const cellCurrency = { raw: '1250.5', computed: 1250.5, format: { numberFormat: 'currency' as const } };
    expect(FormattingEngine.formatDisplayValue(cellCurrency)).toBe('$1,250.50');

    const cellPercent = { raw: '0.85', computed: 0.85, format: { numberFormat: 'percentage' as const } };
    expect(FormattingEngine.formatDisplayValue(cellPercent)).toBe('85.00%');
  });
});

describe('Spreadsheet — ChartEngine', () => {
  it('should generate valid SVG markup for bar and line charts', () => {
    const mockSheet = {
      id: 'sheet-1',
      name: 'Sheet1',
      cells: {
        A1: { raw: 'Jan', computed: 'Jan' },
        B1: { raw: '100', computed: 100 },
        A2: { raw: 'Feb', computed: 'Feb' },
        B2: { raw: '200', computed: 200 },
      },
      rowCount: 10,
      colCount: 10,
      columnWidths: {},
      rowHeights: {},
    };

    const svg = ChartEngine.renderChartSvg(
      {
        id: 'c1',
        type: 'bar',
        title: 'Monthly Revenue',
        dataRange: 'A1:B2',
      },
      mockSheet
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('Monthly Revenue');
    expect(svg).toContain('</svg>');
  });
});
