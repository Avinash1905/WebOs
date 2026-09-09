/**
 * @file DocumentEditor.test.ts
 * @description Comprehensive unit and integration test suite for Document Editor application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentEditorStore } from '../../applications/document-editor/store/documentEditorStore.js';
import { platform } from '../../src/services/webosPlatform.js';
import type { DocHeading, DocParagraph, DocTable } from '../../applications/document-editor/types.js';

describe('Document Editor Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    useDocumentEditorStore.setState({
      document: {
        id: 'doc-test-1',
        title: 'TestDoc.wdoc',
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
                runs: [{ id: 'r-head-1', text: 'Document Title', bold: true }],
              },
            ],
          },
        ],
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        pageSize: { width: 816, height: 1056 },
        isDirty: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      selectedBlockId: 'b-head-1',
      selectedRunId: 'r-head-1',
      selectedTableCell: null,
      searchQuery: '',
      replaceQuery: '',
      isFindOpen: false,
      isPreviewMode: false,
      isSaving: false,
    });
  });

  it('adds paragraphs, headings, and lists to document sections', () => {
    const store = useDocumentEditorStore.getState();
    store.addParagraph(undefined, 'Paragraph text');
    store.addHeading(2, 'Subheading H2');
    store.addList(false);

    const doc = useDocumentEditorStore.getState().document;
    const blocks = doc.sections[0]!.blocks;

    expect(blocks.length).toBe(4);
    expect(blocks[1]!.type).toBe('paragraph');
    expect(blocks[2]!.type).toBe('heading');
    expect((blocks[2] as DocHeading).level).toBe(2);
    expect(blocks[3]!.type).toBe('list');
  });

  it('applies typography formatting and text alignment to runs', () => {
    const store = useDocumentEditorStore.getState();
    store.addParagraph(undefined, 'Sample text');
    const blockId = useDocumentEditorStore.getState().selectedBlockId!;
    const runId = useDocumentEditorStore.getState().selectedRunId!;

    store.toggleRunFormat(blockId, runId, 'bold');
    store.toggleRunFormat(blockId, runId, 'italic');
    store.setBlockAlignment(blockId, 'center');

    const block = useDocumentEditorStore.getState().document.sections[0]!.blocks.find(
      (b) => b.id === blockId
    ) as DocParagraph;

    expect(block.runs[0]!.bold).toBe(true);
    expect(block.runs[0]!.italic).toBe(true);
    expect(block.align).toBe('center');
  });

  it('manipulates structured table rows, columns, and cell text', () => {
    const store = useDocumentEditorStore.getState();
    store.addTable(2, 2);

    const tableBlock = useDocumentEditorStore
      .getState()
      .document.sections[0]!.blocks.find((b) => b.type === 'table') as DocTable;

    expect(tableBlock).toBeDefined();
    expect(tableBlock.rows.length).toBe(2);
    expect(tableBlock.rows[0]!.cells.length).toBe(2);

    // Add row & column
    store.addTableRow(tableBlock.id, 0);
    store.addTableColumn(tableBlock.id, 0);

    const updatedTable = useDocumentEditorStore
      .getState()
      .document.sections[0]!.blocks.find((b) => b.id === tableBlock.id) as DocTable;

    expect(updatedTable.rows.length).toBe(3);
    expect(updatedTable.rows[0]!.cells.length).toBe(3);

    // Cell text editing
    store.updateTableCellText(tableBlock.id, 0, 0, 'Header 1');
    const cellText = useDocumentEditorStore
      .getState()
      .document.sections[0]!.blocks.find((b) => b.id === tableBlock.id) as DocTable;

    expect(cellText.rows[0]!.cells[0]!.runs[0]!.text).toBe('Header 1');
  });

  it('saves and reloads structured documents to VFS', async () => {
    const store = useDocumentEditorStore.getState();
    store.addParagraph(undefined, 'VFS Document Content');

    await store.saveDocumentAs('/home/user/Documents/report.wdoc');

    const state = useDocumentEditorStore.getState();
    expect(state.document.isDirty).toBe(false);
    expect(await platform.fileSystem.exists('/home/user/Documents/report.wdoc')).toBe(true);

    // Reset store
    useDocumentEditorStore.setState({ document: {} as any });

    // Load back
    await store.loadDocumentFromFile('/home/user/Documents/report.wdoc');
    expect(useDocumentEditorStore.getState().document.title).toBe('report.wdoc');
  });
});
