import React from 'react';
import { Search, Replace, X } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';

export const EditorSearchPanel: React.FC = () => {
  const {
    searchParams,
    setSearchParams,
    executeFindReplace,
    setSidebarTab,
  } = useCodeEditorStore();

  return (
    <div className="editor-search-panel">
      <div className="search-panel-header">
        <span className="panel-title">SEARCH & REPLACE</span>
        <button className="icon-btn" onClick={() => setSidebarTab(null)}>
          <X size={14} />
        </button>
      </div>

      <div className="search-inputs-group">
        <div className="input-with-icon">
          <Search size={14} className="input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search query..."
            value={searchParams.findQuery}
            onChange={(e) => setSearchParams({ findQuery: e.target.value })}
          />
        </div>

        <div className="input-with-icon">
          <Replace size={14} className="input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Replace with..."
            value={searchParams.replaceQuery}
            onChange={(e) => setSearchParams({ replaceQuery: e.target.value })}
          />
        </div>
      </div>

      <div className="search-options-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={searchParams.matchCase}
            onChange={(e) => setSearchParams({ matchCase: e.target.checked })}
          />
          Match Case
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={searchParams.wholeWord}
            onChange={(e) => setSearchParams({ wholeWord: e.target.checked })}
          />
          Whole Word
        </label>
      </div>

      <div className="search-actions-row">
        <button
          className="btn btn-secondary"
          onClick={() => executeFindReplace(true, false)}
        >
          Replace
        </button>
        <button
          className="btn btn-primary"
          onClick={() => executeFindReplace(true, true)}
        >
          Replace All
        </button>
      </div>
    </div>
  );
};
