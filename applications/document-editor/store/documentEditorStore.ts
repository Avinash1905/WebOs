/**
 * @file documentEditorStore.ts
 * @description Isolated Zustand store for WebOS Document Editor application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import type {
  DocumentEditorState,
  DocumentEditorActions,
  DocDocument,
  DocBlock,
  DocParagraph,
  DocHeading,
  DocList,
  DocTable,
  DocTextRun,
  AlignmentType,
} from '../types.js';

const DEFAULT_DOC: DocDocument = {
  id: `doc-${Date.now()}`,
  title: 'Untitled Document.wdoc',
  filePath: null,
  sections: [
    {
      id: 'sec-1',
      blocks: [
        {
          type: 'heading',
          id: 'b-head-1',
          level: 1,
          align: 'left',
          runs: [{ id: 'r-head-1', text: 'Document Title', bold: true, fontSize: 24 }],
        },
        {
          type: 'paragraph',
          id: 'b-para-1',
          align: 'left',
          runs: [
            {
              id: 'r-para-1',
              text: 'Welcome to WebOS Document Editor! This is a structured word processor supporting page boundaries, headings, text formatting, lists, and tables.',
            },
          ],
        },
      ],
    },
  ],
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  pageSize: { width: 816, height: 1056 }, // Standard Letter page dimensions in px
  isDirty: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

let docAutosaveTimer: any = null;

export const useDocumentEditorStore = create<DocumentEditorState & DocumentEditorActions>((set, get) => ({
  document: DEFAULT_DOC,
  selectedBlockId: 'b-para-1',
  selectedRunId: 'r-para-1',
  selectedTableCell: null,
  searchQuery: '',
  replaceQuery: '',
  isFindOpen: false,
  isPreviewMode: false,
  isSaving: false,

  addParagraph: (afterBlockId, text = 'New paragraph...') => {
    const { document } = get();
    const section = document.sections[0]!;
    const newRun: DocTextRun = { id: `r-${Date.now()}`, text };
    const newBlock: DocParagraph = {
      type: 'paragraph',
      id: `b-${Date.now()}`,
      align: 'left',
      runs: [newRun],
    };

    let updatedBlocks: DocBlock[];
    if (afterBlockId) {
      const idx = section.blocks.findIndex((b) => b.id === afterBlockId);
      if (idx !== -1) {
        updatedBlocks = [...section.blocks.slice(0, idx + 1), newBlock, ...section.blocks.slice(idx + 1)];
      } else {
        updatedBlocks = [...section.blocks, newBlock];
      }
    } else {
      updatedBlocks = [...section.blocks, newBlock];
    }

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
      selectedBlockId: newBlock.id,
      selectedRunId: newRun.id,
    });
  },

  addHeading: (level, text = 'New Heading') => {
    const { document } = get();
    const section = document.sections[0]!;
    const newRun: DocTextRun = { id: `r-${Date.now()}`, text, bold: true };
    const newHeading: DocHeading = {
      type: 'heading',
      id: `b-${Date.now()}`,
      level,
      align: 'left',
      runs: [newRun],
    };

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: [...section.blocks, newHeading] }],
      },
      selectedBlockId: newHeading.id,
      selectedRunId: newRun.id,
    });
  },

  addList: (ordered = false) => {
    const { document } = get();
    const section = document.sections[0]!;
    const newList: DocList = {
      type: 'list',
      id: `b-${Date.now()}`,
      ordered,
      items: [
        { id: `li-1`, runs: [{ id: `r-li-1`, text: 'First item' }] },
        { id: `li-2`, runs: [{ id: `r-li-2`, text: 'Second item' }] },
      ],
    };

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: [...section.blocks, newList] }],
      },
      selectedBlockId: newList.id,
    });
  },

  addTable: (rows = 3, cols = 3) => {
    const { document } = get();
    const section = document.sections[0]!;

    const tableRows = Array.from({ length: rows }).map((_, rIdx) => ({
      id: `row-${Date.now()}-${rIdx}`,
      cells: Array.from({ length: cols }).map((_, cIdx) => ({
        id: `cell-${Date.now()}-${rIdx}-${cIdx}`,
        runs: [{ id: `r-cell-${rIdx}-${cIdx}`, text: `Cell ${rIdx + 1},${cIdx + 1}` }],
      })),
    }));

    const newTable: DocTable = {
      type: 'table',
      id: `b-tbl-${Date.now()}`,
      rows: tableRows,
    };

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: [...section.blocks, newTable] }],
      },
      selectedBlockId: newTable.id,
    });
  },

  updateTextRun: (blockId, runId, text) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== blockId) return block;
      if (block.type === 'paragraph' || block.type === 'heading') {
        const updatedRuns = block.runs.map((r) => (r.id === runId ? { ...r, text } : r));
        return { ...block, runs: updatedRuns };
      }
      return block;
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  toggleRunFormat: (blockId, runId, format) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== blockId) return block;
      if (block.type === 'paragraph' || block.type === 'heading') {
        const updatedRuns = block.runs.map((r) =>
          r.id === runId ? { ...r, [format]: !r[format] } : r
        );
        return { ...block, runs: updatedRuns };
      }
      return block;
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  setBlockAlignment: (blockId, align) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== blockId) return block;
      if (block.type === 'paragraph' || block.type === 'heading') {
        return { ...block, align };
      }
      return block;
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  updateTableCellText: (tableId, rowIndex, colIndex, text) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== tableId || block.type !== 'table') return block;
      const rows = [...block.rows];
      const targetRow = rows[rowIndex];
      if (!targetRow) return block;

      const cells = [...targetRow.cells];
      const targetCell = cells[colIndex];
      if (!targetCell) return block;

      cells[colIndex] = { ...targetCell, runs: [{ id: `r-${Date.now()}`, text }] };
      rows[rowIndex] = { ...targetRow, cells };

      return { ...block, rows };
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  addTableRow: (tableId, afterRowIndex = 0) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== tableId || block.type !== 'table') return block;
      const numCols = block.rows[0]?.cells.length || 3;

      const newRow = {
        id: `row-${Date.now()}`,
        cells: Array.from({ length: numCols }).map((_, cIdx) => ({
          id: `cell-${Date.now()}-${cIdx}`,
          runs: [{ id: `r-${Date.now()}-${cIdx}`, text: `Cell` }],
        })),
      };

      const rows = [...block.rows.slice(0, afterRowIndex + 1), newRow, ...block.rows.slice(afterRowIndex + 1)];
      return { ...block, rows };
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  removeTableRow: (tableId, rowIndex) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== tableId || block.type !== 'table') return block;
      if (block.rows.length <= 1) return block; // Keep at least one row
      const rows = block.rows.filter((_, idx) => idx !== rowIndex);
      return { ...block, rows };
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  addTableColumn: (tableId, afterColIndex = 0) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== tableId || block.type !== 'table') return block;

      const rows = block.rows.map((row) => {
        const newCell = {
          id: `cell-${Date.now()}`,
          runs: [{ id: `r-${Date.now()}`, text: 'Cell' }],
        };
        const cells = [...row.cells.slice(0, afterColIndex + 1), newCell, ...row.cells.slice(afterColIndex + 1)];
        return { ...row, cells };
      });

      return { ...block, rows };
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  removeTableColumn: (tableId, colIndex) => {
    const { document } = get();
    const section = document.sections[0]!;

    const updatedBlocks = section.blocks.map((block) => {
      if (block.id !== tableId || block.type !== 'table') return block;
      if (block.rows[0] && block.rows[0].cells.length <= 1) return block;

      const rows = block.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, idx) => idx !== colIndex),
      }));

      return { ...block, rows };
    });

    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
    });
  },

  deleteBlock: (blockId) => {
    const { document } = get();
    const section = document.sections[0]!;
    if (section.blocks.length <= 1) return; // Don't delete last block

    const updatedBlocks = section.blocks.filter((b) => b.id !== blockId);
    set({
      document: {
        ...document,
        isDirty: true,
        sections: [{ ...section, blocks: updatedBlocks }],
      },
      selectedBlockId: updatedBlocks[0]?.id || null,
    });
  },

  selectBlock: (blockId, runId = null) => {
    set({ selectedBlockId: blockId, selectedRunId: runId });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setReplaceQuery: (query) => set({ replaceQuery: query }),
  toggleFind: () => set({ isFindOpen: !get().isFindOpen }),
  togglePreviewMode: () => set({ isPreviewMode: !get().isPreviewMode }),

  saveDocument: async () => {
    const { document } = get();
    if (!document.filePath) {
      const newPath = window.prompt(
        'Save document as (enter path):',
        `/home/user/Documents/${document.title}`
      );
      if (!newPath) return;
      await get().saveDocumentAs(newPath.trim());
      return;
    }

    set({ isSaving: true });
    try {
      await platform.initialize();
      const contentStr = JSON.stringify(document, null, 2);
      await platform.fileSystem.createFile(document.filePath, { content: contentStr, overwrite: true });
      set({ document: { ...document, isDirty: false }, isSaving: false });
    } catch (err: any) {
      alert(`Save failed: ${err?.message || 'Unknown error'}`);
      set({ isSaving: false });
    }
  },

  saveDocumentAs: async (newPath: string) => {
    const { document } = get();
    set({ isSaving: true });
    try {
      await platform.initialize();
      const fileName = newPath.split('/').pop() || 'Document.wdoc';
      const updatedDoc = { ...document, filePath: newPath, title: fileName, isDirty: false };
      const contentStr = JSON.stringify(updatedDoc, null, 2);
      await platform.fileSystem.createFile(newPath, { content: contentStr, overwrite: true });
      set({ document: updatedDoc, isSaving: false });
    } catch (err: any) {
      alert(`Save As failed: ${err?.message || 'Unknown error'}`);
      set({ isSaving: false });
    }
  },

  loadDocumentFromFile: async (filePath: string) => {
    try {
      await platform.initialize();
      const raw = await platform.fileSystem.readFile(filePath, { encoding: 'utf-8' });
      const parsed = JSON.parse(String(raw));
      if (parsed && parsed.sections) {
        set({ document: { ...parsed, filePath, isDirty: false } });
      }
    } catch (err: any) {
      alert(`Failed to load document: ${err?.message || 'Invalid format'}`);
    }
  },
}));
