/**
 * @file DocumentEditorApp.tsx
 * @description Main application container for WebOS Document Editor.
 */

import React, { useEffect } from 'react';
import { useDocumentEditorStore } from './store/documentEditorStore.js';
import { DocumentToolbar } from './components/DocumentToolbar.js';
import { DocumentPage } from './components/DocumentPage.js';
import { DocumentFindReplace } from './components/DocumentFindReplace.js';
import './documentEditor.css';

export interface DocumentEditorAppProps {
  windowId?: string;
  appId?: string;
  initialFilePath?: string;
}

export const DocumentEditorApp: React.FC<DocumentEditorAppProps> = ({ initialFilePath }) => {
  const { document, isSaving, loadDocumentFromFile } = useDocumentEditorStore();

  useEffect(() => {
    if (initialFilePath) {
      loadDocumentFromFile(initialFilePath);
    }
  }, [initialFilePath]);

  const blockCount = document.sections[0]?.blocks.length || 0;

  return (
    <div className="doc-app">
      {/* Document Action & Formatting Toolbar */}
      <DocumentToolbar />

      {/* Find & Replace Panel */}
      <DocumentFindReplace />

      {/* Page Canvas Viewport */}
      <DocumentPage />

      {/* Status Bar */}
      <div className="doc-status-bar">
        <div className="doc-status-left">
          <span>{document.title}</span>
          <span style={{ margin: '0 8px', color: '#475569' }}>|</span>
          <span>{blockCount} block(s)</span>
          {document.isDirty && <span style={{ marginLeft: 8, color: '#eab308' }}>(Unsaved)</span>}
        </div>
        <div className="doc-status-right">
          {isSaving && <span style={{ color: '#38bdf8' }}>Saving document...</span>}
          {!isSaving && <span>Letter Page (8.5" x 11")</span>}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorApp;
