/**
 * @file applications/spreadsheet/store/spreadsheetStore.ts
 * @description Isolated Zustand store for WebOS Spreadsheet application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import { CellModel } from '../engine/CellModel.js';
import { DependencyGraph } from '../engine/DependencyGraph.js';
import { ClipboardFillEngine } from '../engine/ClipboardFillEngine.js';
import { SortFilterEngine } from '../engine/SortFilterEngine.js';
import type {
  SpreadsheetState,
  SpreadsheetActions,
  SpreadsheetWorkbook,
  SpreadsheetSheet,
  CellMap,
  CellSelection,
  CellFormat,
} from '../types.js';

function createDefaultSheet(id = 'sheet-1', name = 'Sheet1'): SpreadsheetSheet {
  const initialCells: CellMap = {
    A1: { raw: 'Revenue Model', format: { bold: true, fontSize: 16 } },
    A3: { raw: 'Product A', format: { bold: true } },
    B3: { raw: '100', type: 'number', computed: 100 },
    A4: { raw: 'Product B', format: { bold: true } },
    B4: { raw: '250', type: 'number', computed: 250 },
    A5: { raw: 'Total', format: { bold: true } },
    B5: { raw: '=SUM(B3:B4)', computed: 350, format: { bold: true, numberFormat: 'currency' } },
  };

  return {
    id,
    name,
    cells: DependencyGraph.recalculateAll(initialCells),
    rowCount: 50,
    colCount: 26,
    columnWidths: {},
    rowHeights: {},
  };
}

function createDefaultWorkbook(): SpreadsheetWorkbook {
  const sheet = createDefaultSheet();
  return {
    id: `wb-${Date.now()}`,
    title: 'Financial_Model.wks',
    filePath: null,
    sheets: [sheet],
    activeSheetId: sheet.id,
    charts: [],
    isDirty: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const useSpreadsheetStore = create<SpreadsheetState & SpreadsheetActions>((set, get) => ({
  workbook: createDefaultWorkbook(),
  selectedCell: { row: 0, col: 0 },
  selectionRange: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
  editingCell: null,
  formulaBuffer: 'Revenue Model',
  clipboardRange: null,
  isChartModalOpen: false,
  isFilterModalOpen: false,
  undoStack: [],
  redoStack: [],

  createWorkbook: (title = 'Untitled_Workbook.wks') => {
    const wb = createDefaultWorkbook();
    wb.title = title;
    set({
      workbook: wb,
      selectedCell: { row: 0, col: 0 },
      selectionRange: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
      formulaBuffer: '',
      undoStack: [],
      redoStack: [],
    });
  },

  loadWorkbookFromFile: async (filePath: string) => {
    try {
      await platform.initialize();
      const raw = String(await platform.fileSystem.readFile(filePath, { encoding: 'utf-8' }));
      const parsed: SpreadsheetWorkbook = JSON.parse(raw);
      set({
        workbook: parsed,
        selectedCell: { row: 0, col: 0 },
        selectionRange: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
      });
    } catch (err) {
      console.error('[Spreadsheet] Failed to load workbook:', err);
    }
  },

  saveWorkbook: async () => {
    const { workbook, saveWorkbookAs } = get();
    if (!workbook.filePath) {
      return await saveWorkbookAs(`/home/user/Documents/${workbook.title}`);
    }
    try {
      await platform.fileSystem.createFile(workbook.filePath, {
        content: JSON.stringify(workbook, null, 2),
        overwrite: true,
      });
      set({ workbook: { ...workbook, isDirty: false } });
      return true;
    } catch {
      return false;
    }
  },

  saveWorkbookAs: async (targetPath: string) => {
    const { workbook } = get();
    try {
      const fileName = targetPath.split('/').pop() || workbook.title;
      const updatedWb = { ...workbook, title: fileName, filePath: targetPath, isDirty: false };
      await platform.fileSystem.createFile(targetPath, {
        content: JSON.stringify(updatedWb, null, 2),
        overwrite: true,
      });
      set({ workbook: updatedWb });
      return true;
    } catch {
      return false;
    }
  },

  addSheet: (name) => {
    const { workbook } = get();
    const sheetCount = workbook.sheets.length + 1;
    const newSheet = createDefaultSheet(`sheet-${Date.now()}`, name || `Sheet${sheetCount}`);
    const updatedSheets = [...workbook.sheets, newSheet];

    set({
      workbook: {
        ...workbook,
        sheets: updatedSheets,
        activeSheetId: newSheet.id,
        isDirty: true,
      },
    });
  },

  deleteSheet: (sheetId: string) => {
    const { workbook } = get();
    if (workbook.sheets.length <= 1) return;

    const filtered = workbook.sheets.filter((s) => s.id !== sheetId);
    let nextActiveId = workbook.activeSheetId;
    if (workbook.activeSheetId === sheetId) {
      nextActiveId = filtered[filtered.length - 1]!.id;
    }

    set({
      workbook: {
        ...workbook,
        sheets: filtered,
        activeSheetId: nextActiveId,
        isDirty: true,
      },
    });
  },

  renameSheet: (sheetId: string, name: string) => {
    if (!name.trim()) return;
    const { workbook } = get();
    const updated = workbook.sheets.map((s) => (s.id === sheetId ? { ...s, name: name.trim() } : s));
    set({ workbook: { ...workbook, sheets: updated, isDirty: true } });
  },

  setActiveSheet: (sheetId: string) => {
    const { workbook } = get();
    const targetSheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!targetSheet) return;

    const coord = CellModel.toCoordinate(0, 0);
    const cell = targetSheet.cells[coord];

    set({
      workbook: { ...workbook, activeSheetId: sheetId },
      selectedCell: { row: 0, col: 0 },
      selectionRange: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
      formulaBuffer: cell ? cell.raw : '',
    });
  },

  selectCell: (row, col, extend = false) => {
    const { selectedCell, selectionRange, workbook } = get();
    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const coord = CellModel.toCoordinate(row, col);
    const cell = activeSheet.cells[coord];

    if (extend && selectedCell) {
      const newRange: CellSelection = {
        startRow: Math.min(selectedCell.row, row),
        startCol: Math.min(selectedCell.col, col),
        endRow: Math.max(selectedCell.row, row),
        endCol: Math.max(selectedCell.col, col),
      };
      set({ selectionRange: newRange, formulaBuffer: cell ? cell.raw : '' });
    } else {
      set({
        selectedCell: { row, col },
        selectionRange: { startRow: row, startCol: col, endRow: row, endCol: col },
        formulaBuffer: cell ? cell.raw : '',
      });
    }
  },

  setSelectionRange: (range) => set({ selectionRange: range }),
  setEditingCell: (cell) => set({ editingCell: cell }),

  updateCellValue: (row, col, rawValue) => {
    const { workbook, undoStack } = get();
    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const coord = CellModel.toCoordinate(row, col);
    const currentCells = activeSheet.cells;
    const oldCell = currentCells[coord] || { raw: '' };

    const updatedCellMap: CellMap = {
      ...currentCells,
      [coord]: {
        ...oldCell,
        raw: rawValue,
      },
    };

    const recalculated = DependencyGraph.recalculateAll(updatedCellMap);

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: recalculated } : s
    );

    set({
      workbook: { ...workbook, sheets: updatedSheets, isDirty: true },
      formulaBuffer: rawValue,
      undoStack: [...undoStack, currentCells].slice(-30),
      redoStack: [],
    });
  },

  updateCellFormat: (formatUpdate: Partial<CellFormat>) => {
    const { workbook, selectionRange } = get();
    if (!selectionRange) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const coords = CellModel.getCoordinatesInRange(selectionRange);
    const updatedCells: CellMap = { ...activeSheet.cells };

    coords.forEach((c) => {
      const existing = updatedCells[c] || { raw: '' };
      updatedCells[c] = {
        ...existing,
        format: { ...existing.format, ...formatUpdate },
      };
    });

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: updatedCells } : s
    );

    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  copySelection: (action = 'copy') => {
    const { selectionRange } = get();
    if (selectionRange) {
      set({ clipboardRange: { range: selectionRange, action } });
    }
  },

  pasteClipboard: () => {
    const { workbook, clipboardRange, selectedCell } = get();
    if (!clipboardRange || !selectedCell) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const pastedMap = ClipboardFillEngine.pasteRange(
      activeSheet.cells,
      clipboardRange.range,
      selectedCell.row,
      selectedCell.col
    );

    const recalculated = DependencyGraph.recalculateAll(pastedMap);
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: recalculated } : s
    );

    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  fillRange: (direction) => {
    const { workbook, selectionRange } = get();
    if (!selectionRange) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const filledMap = ClipboardFillEngine.fillSeries(activeSheet.cells, selectionRange, direction);
    const recalculated = DependencyGraph.recalculateAll(filledMap);

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: recalculated } : s
    );

    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  sortSelectedRange: (colIndex, ascending = true) => {
    const { workbook, selectionRange } = get();
    if (!selectionRange) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const sortedMap = SortFilterEngine.sortRange(activeSheet.cells, selectionRange, colIndex, ascending);
    const recalculated = DependencyGraph.recalculateAll(sortedMap);

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: recalculated } : s
    );

    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  addChart: (chartData) => {
    const { workbook } = get();
    const newChart = { ...chartData, id: `chart-${Date.now()}` };
    set({
      workbook: { ...workbook, charts: [...workbook.charts, newChart], isDirty: true },
      isChartModalOpen: false,
    });
  },

  deleteChart: (chartId: string) => {
    const { workbook } = get();
    const filtered = workbook.charts.filter((c) => c.id !== chartId);
    set({ workbook: { ...workbook, charts: filtered, isDirty: true } });
  },

  toggleChartModal: (open) => {
    set({ isChartModalOpen: open !== undefined ? open : !get().isChartModalOpen });
  },

  toggleFilterModal: (open) => {
    set({ isFilterModalOpen: open !== undefined ? open : !get().isFilterModalOpen });
  },

  undo: () => {
    const { workbook, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const prevMap = undoStack[undoStack.length - 1]!;
    const updatedUndo = undoStack.slice(0, -1);
    const updatedRedo = [activeSheet.cells, ...redoStack];

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: prevMap } : s
    );

    set({
      workbook: { ...workbook, sheets: updatedSheets, isDirty: true },
      undoStack: updatedUndo,
      redoStack: updatedRedo,
    });
  },

  redo: () => {
    const { workbook, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const nextMap = redoStack[0]!;
    const updatedRedo = redoStack.slice(1);
    const updatedUndo = [...undoStack, activeSheet.cells];

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, cells: nextMap } : s
    );

    set({
      workbook: { ...workbook, sheets: updatedSheets, isDirty: true },
      undoStack: updatedUndo,
      redoStack: updatedRedo,
    });
  },

  resizeColumn: (colIndex, width) => {
    const { workbook } = get();
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId
        ? { ...s, columnWidths: { ...s.columnWidths, [colIndex]: width } }
        : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  resizeRow: (rowIndex, height) => {
    const { workbook } = get();
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId
        ? { ...s, rowHeights: { ...s.rowHeights, [rowIndex]: height } }
        : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  insertRow: (index) => {
    const { workbook } = get();
    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet) return;

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, rowCount: s.rowCount + 1 } : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  deleteRow: (index) => {
    const { workbook } = get();
    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet || activeSheet.rowCount <= 1) return;

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, rowCount: s.rowCount - 1 } : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  insertColumn: (index) => {
    const { workbook } = get();
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, colCount: s.colCount + 1 } : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },

  setFormulaBuffer: (val) => set({ formulaBuffer: val }),
  deleteColumn: (index) => {
    const { workbook } = get();
    const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId);
    if (!activeSheet || activeSheet.colCount <= 1) return;

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === workbook.activeSheetId ? { ...s, colCount: s.colCount - 1 } : s
    );
    set({ workbook: { ...workbook, sheets: updatedSheets, isDirty: true } });
  },
}));
