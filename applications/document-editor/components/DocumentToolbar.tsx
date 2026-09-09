/**
 * @file DocumentToolbar.tsx
 * @description Rich toolbar for Document Editor supporting headings, text runs, alignments, and tables.
 */

import React from 'react';
import {
  Save,
  FilePlus,
  FolderOpen,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Search,
  Eye,
} from 'lucide-react';
import { useDocumentEditorStore } from '../store/documentEditorStore.js';

export const DocumentToolbar: React.FC = () => {
  const {
    document,
    selectedBlockId,
    selectedRunId,
    saveDocument,
    saveDocumentAs,
    loadDocumentFromFile,
    addParagraph,
    addHeading,
    addList,
    addTable,
    toggleRunFormat,
    setBlockAlignment,
    toggleFind,
    togglePreviewMode,
    isPreviewMode,
  } = useDocumentEditorStore();

  const handleOpenClick = () => {
    const filePath = window.prompt(
      'Enter document path to open:',
      '/home/user/Documents/sample.wdoc'
    );
    if (filePath && filePath.trim()) {
      loadDocumentFromFile(filePath.trim());
    }
  };

  const handleSaveAsClick = () => {
    const defaultPath = document.filePath || `/home/user/Documents/${document.title}`;
    const newPath = window.prompt('Save Document As:', defaultPath);
    if (newPath && newPath.trim()) {
      saveDocumentAs(newPath.trim());
    }
  };

  return (
    <div className="doc-toolbar">
      {/* File Actions */}
      <div className="doc-toolbar-group">
        <button
          className="doc-btn doc-btn-accent"
          disabled={!document.isDirty}
          onClick={saveDocument}
          title="Save Document (Ctrl+S)"
        >
          <Save size={15} />
          <span>Save</span>
        </button>
        <button className="doc-btn" onClick={handleOpenClick} title="Open Document">
          <FolderOpen size={15} />
          <span>Open</span>
        </button>
        <button className="doc-btn" onClick={handleSaveAsClick} title="Save As">
          <span>Save As...</span>
        </button>
      </div>

      <div className="doc-toolbar-divider" />

      {/* Block Creation */}
      <div className="doc-toolbar-group">
        <button className="doc-btn" onClick={() => addParagraph()} title="Add Paragraph">
          <FilePlus size={15} />
          <span>Paragraph</span>
        </button>
        <select
          className="doc-select"
          onChange={(e) => {
            const level = Number(e.target.value) as 1 | 2 | 3;
            if (level) addHeading(level);
          }}
          defaultValue=""
          title="Insert Heading"
        >
          <option value="" disabled>
            Heading...
          </option>
          <option value="1">Heading 1 (H1)</option>
          <option value="2">Heading 2 (H2)</option>
          <option value="3">Heading 3 (H3)</option>
        </select>
        <button className="doc-btn" onClick={() => addList(false)} title="Bullet List">
          <List size={15} />
        </button>
        <button className="doc-btn" onClick={() => addList(true)} title="Numbered List">
          <ListOrdered size={15} />
        </button>
        <button className="doc-btn" onClick={() => addTable(3, 3)} title="Insert Table (3x3)">
          <Table size={15} />
          <span>Table</span>
        </button>
      </div>

      <div className="doc-toolbar-divider" />

      {/* Formatting & Alignment */}
      <div className="doc-toolbar-group">
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId || !selectedRunId}
          onClick={() => {
            if (selectedBlockId && selectedRunId) toggleRunFormat(selectedBlockId, selectedRunId, 'bold');
          }}
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId || !selectedRunId}
          onClick={() => {
            if (selectedBlockId && selectedRunId) toggleRunFormat(selectedBlockId, selectedRunId, 'italic');
          }}
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId || !selectedRunId}
          onClick={() => {
            if (selectedBlockId && selectedRunId) toggleRunFormat(selectedBlockId, selectedRunId, 'underline');
          }}
          title="Underline (Ctrl+U)"
        >
          <Underline size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId || !selectedRunId}
          onClick={() => {
            if (selectedBlockId && selectedRunId) toggleRunFormat(selectedBlockId, selectedRunId, 'strikethrough');
          }}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
      </div>

      <div className="doc-toolbar-divider" />

      {/* Alignments */}
      <div className="doc-toolbar-group">
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId}
          onClick={() => selectedBlockId && setBlockAlignment(selectedBlockId, 'left')}
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId}
          onClick={() => selectedBlockId && setBlockAlignment(selectedBlockId, 'center')}
          title="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId}
          onClick={() => selectedBlockId && setBlockAlignment(selectedBlockId, 'right')}
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>
        <button
          className="doc-btn doc-btn-icon"
          disabled={!selectedBlockId}
          onClick={() => selectedBlockId && setBlockAlignment(selectedBlockId, 'justify')}
          title="Justify"
        >
          <AlignJustify size={15} />
        </button>
      </div>

      <div className="doc-toolbar-spacer" />

      {/* Search & Print Preview */}
      <div className="doc-toolbar-group">
        <button className="doc-btn doc-btn-icon" onClick={toggleFind} title="Find & Replace">
          <Search size={15} />
        </button>
        <button
          className={`doc-btn ${isPreviewMode ? 'doc-btn-accent' : ''}`}
          onClick={togglePreviewMode}
          title="Print Preview Mode"
        >
          <Eye size={15} />
          <span>{isPreviewMode ? 'Exit Preview' : 'Print Preview'}</span>
        </button>
      </div>
    </div>
  );
};
