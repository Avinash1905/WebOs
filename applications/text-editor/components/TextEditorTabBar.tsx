/**
 * @file TextEditorTabBar.tsx
 * @description Tab header bar supporting multi-document editing tabs and close buttons.
 */

import React from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorTabBar: React.FC = () => {
  const { tabs, activeTabId, createNewTab, closeTab, setActiveTab } = useTextEditorStore();

  return (
    <div className="te-tab-bar">
      <div className="te-tab-scroll">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`te-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <FileText size={14} className="te-tab-icon" />
              <span className="te-tab-title">
                {tab.title}
                {tab.isDirty && <span className="te-dirty-indicator">*</span>}
              </span>
              <button
                className="te-tab-close-btn"
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
      </div>

      <button
        className="te-new-tab-btn"
        title="New Document"
        onClick={() => createNewTab()}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
