/**
 * @file applications/spreadsheet/types.ts
 * @description Data models and interfaces for WebOS Spreadsheet application.
 */

export type CellValueType = 'text' | 'number' | 'boolean' | 'date' | 'formula' | 'error' | 'empty';

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date';
  decimalPlaces?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  wrapText?: boolean;
}

export interface CellData {
  raw: string;
  computed?: string | number | boolean;
  type?: CellValueType;
  format?: CellFormat;
  comment?: string;
}

export type CellMap = Record<string, CellData>; // key e.g. "A1"

export interface SpreadsheetSheet {
  id: string;
  name: string;
  cells: CellMap;
  rowCount: number;
  colCount: number;
  columnWidths: Record<number, number>; // colIndex -> width px
  rowHeights: Record<number, number>; // rowIndex -> height px
  frozenRows?: number;
  frozenCols?: number;
}

export interface SpreadsheetChart {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  dataRange: string; // e.g. "A1:B5"
  labelsRange?: string;
}

export interface SpreadsheetWorkbook {
  id: string;
  title: string;
  filePath: string | null;
  sheets: SpreadsheetSheet[];
  activeSheetId: string;
  charts: SpreadsheetChart[];
  isDirty: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CellSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SpreadsheetState {
  workbook: SpreadsheetWorkbook;
  selectedCell: { row: number; col: number } | null;
  selectionRange: CellSelection | null;
  editingCell: { row: number; col: number } | null;
  formulaBuffer: string;
  clipboardRange: { range: CellSelection; action: 'copy' | 'cut' } | null;
  isChartModalOpen: boolean;
  isFilterModalOpen: boolean;
  undoStack: CellMap[];
  redoStack: CellMap[];
}

export interface SpreadsheetActions {
  createWorkbook: (title?: string) => void;
  loadWorkbookFromFile: (filePath: string) => Promise<void>;
  saveWorkbook: () => Promise<boolean>;
  saveWorkbookAs: (targetPath: string) => Promise<boolean>;
  addSheet: (name?: string) => void;
  deleteSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  setActiveSheet: (sheetId: string) => void;
  selectCell: (row: number, col: number, extend?: boolean) => void;
  setSelectionRange: (range: CellSelection) => void;
  setEditingCell: (cell: { row: number; col: number } | null) => void;
  updateCellValue: (row: number, col: number, rawValue: string) => void;
  updateCellFormat: (format: Partial<CellFormat>) => void;
  copySelection: (action?: 'copy' | 'cut') => void;
  pasteClipboard: () => void;
  fillRange: (direction: 'down' | 'up' | 'left' | 'right') => void;
  sortSelectedRange: (colIndex: number, ascending?: boolean) => void;
  addChart: (chart: Omit<SpreadsheetChart, 'id'>) => void;
  deleteChart: (chartId: string) => void;
  toggleChartModal: (open?: boolean) => void;
  toggleFilterModal: (open?: boolean) => void;
  undo: () => void;
  redo: () => void;
  resizeColumn: (colIndex: number, width: number) => void;
  resizeRow: (rowIndex: number, height: number) => void;
  insertRow: (index: number) => void;
  deleteRow: (index: number) => void;
  setFormulaBuffer: (val: string) => void;
  insertColumn: (index: number) => void;
  deleteColumn: (index: number) => void;
}
