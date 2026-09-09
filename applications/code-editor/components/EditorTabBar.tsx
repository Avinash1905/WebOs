import React from 'react';
import { FileText, X, Plus } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';

export const EditorTabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    createNewFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    switchTab,
  } = useCodeEditorStore();

  return (
    <div className="editor-tab-bar">
      <div className="editor-tabs-scroll">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (window.confirm(`Close other tabs except ${tab.title}?`)) {
                  closeOtherTabs(tab.id);
                }
              }}
            >
              <FileText size={14} className="tab-icon" />
              <span className="tab-title">
                {tab.title}
                {tab.isDirty && <span className="dirty-indicator">*</span>}
              </span>
              <button
                className="tab-close-btn"
                title="Close Tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button className="new-tab-btn" title="New File (Ctrl+N)" onClick={() => createNewFile()}>
          <Plus size={14} />
        </button>
      </div>

      {tabs.length > 1 && (
        <button className="close-all-btn" title="Close All Tabs" onClick={closeAllTabs}>
          Close All
        </button>
      )}
    </div>
  );
};
