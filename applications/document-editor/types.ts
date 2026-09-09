/**
 * @file types.ts
 * @description Typed structured document model and contracts for WebOS Document Editor.
 */

export type AlignmentType = 'left' | 'center' | 'right' | 'justify';

export interface DocTextRun {
  id: string;
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  color?: string;
  link?: string;
}

export interface DocParagraph {
  type: 'paragraph';
  id: string;
  align?: AlignmentType;
  lineSpacing?: number;
  runs: DocTextRun[];
}

export interface DocHeading {
  type: 'heading';
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align?: AlignmentType;
  runs: DocTextRun[];
}

export interface DocList {
  type: 'list';
  id: string;
  ordered: boolean;
  items: Array<{ id: string; runs: DocTextRun[] }>;
}

export interface DocTableCell {
  id: string;
  runs: DocTextRun[];
  backgroundColor?: string;
}

export interface DocTableRow {
  id: string;
  cells: DocTableCell[];
}

export interface DocTable {
  type: 'table';
  id: string;
  rows: DocTableRow[];
}

export type DocBlock = DocParagraph | DocHeading | DocList | DocTable;

export interface DocSection {
  id: string;
  blocks: DocBlock[];
}

export interface DocDocument {
  id: string;
  title: string;
  filePath: string | null;
  sections: DocSection[];
  margins: { top: number; bottom: number; left: number; right: number };
  pageSize: { width: number; height: number };
  isDirty: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentEditorState {
  document: DocDocument;
  selectedBlockId: string | null;
  selectedRunId: string | null;
  selectedTableCell: { tableId: string; rowIndex: number; colIndex: number } | null;
  searchQuery: string;
  replaceQuery: string;
  isFindOpen: boolean;
  isPreviewMode: boolean;
  isSaving: boolean;
}

export interface DocumentEditorActions {
  addParagraph: (afterBlockId?: string, text?: string) => void;
  addHeading: (level: 1 | 2 | 3 | 4 | 5 | 6, text?: string) => void;
  addList: (ordered?: boolean) => void;
  addTable: (rows?: number, cols?: number) => void;
  
  updateTextRun: (blockId: string, runId: string, text: string) => void;
  toggleRunFormat: (blockId: string, runId: string, format: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  setBlockAlignment: (blockId: string, align: AlignmentType) => void;
  
  // Table operations
  updateTableCellText: (tableId: string, rowIndex: number, colIndex: number, text: string) => void;
  addTableRow: (tableId: string, afterRowIndex?: number) => void;
  removeTableRow: (tableId: string, rowIndex: number) => void;
  addTableColumn: (tableId: string, afterColIndex?: number) => void;
  removeTableColumn: (tableId: string, colIndex: number) => void;
  
  deleteBlock: (blockId: string) => void;
  selectBlock: (blockId: string | null, runId?: string | null) => void;
  
  setSearchQuery: (query: string) => void;
  setReplaceQuery: (query: string) => void;
  toggleFind: () => void;
  togglePreviewMode: () => void;
  
  saveDocument: () => Promise<void>;
  saveDocumentAs: (newPath: string) => Promise<void>;
  loadDocumentFromFile: (filePath: string) => Promise<void>;
}
