/**
 * @file DocumentFindReplace.tsx
 * @description Find & Replace panel for searching across structured document blocks.
 */

import React from 'react';
import { X, Search, Replace, ReplaceAll } from 'lucide-react';
import { useDocumentEditorStore } from '../store/documentEditorStore.js';

export const DocumentFindReplace: React.FC = () => {
  const {
    document,
    isFindOpen,
    searchQuery,
    replaceQuery,
    setSearchQuery,
    setReplaceQuery,
    toggleFind,
    updateTextRun,
  } = useDocumentEditorStore();

  if (!isFindOpen) return null;

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;

    document.sections.forEach((sec) => {
      sec.blocks.forEach((block) => {
        if (block.type === 'paragraph' || block.type === 'heading') {
          block.runs.forEach((run) => {
            if (run.text.includes(searchQuery)) {
              const newText = run.text.replaceAll(searchQuery, replaceQuery);
              updateTextRun(block.id, run.id, newText);
            }
          });
        }
      });
    });
  };

  return (
    <div className="doc-find-panel">
      <div className="doc-fr-row">
        <input
          type="text"
          className="doc-fr-input"
          placeholder="Find text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <input
          type="text"
          className="doc-fr-input"
          placeholder="Replace with..."
          value={replaceQuery}
          onChange={(e) => setReplaceQuery(e.target.value)}
        />
        <button className="doc-btn" onClick={handleReplaceAll} disabled={!searchQuery.trim()}>
          <ReplaceAll size={14} />
          <span>Replace All</span>
        </button>
        <button className="doc-btn-icon" onClick={toggleFind}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
