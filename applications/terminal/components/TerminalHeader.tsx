import React, { useState } from 'react';
import { Plus, X, Terminal, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useTerminalStore } from '../store/terminalStore.js';

export const TerminalHeader: React.FC = () => {
  const {
    tabs,
    activeTabId,
    createNewTab,
    closeTab,
    switchTab,
    renameTab,
    clearActiveTabOutput,
    isFullscreen,
    toggleFullscreen,
  } = useTerminalStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleDoubleClickTab = (id: string, currentTitle: string) => {
    setEditingTabId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameTab(id, editTitle);
    }
    setEditingTabId(null);
  };

  return (
    <div className="terminal-header">
      <div className="terminal-tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`terminal-tab ${isActive ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
              onDoubleClick={() => handleDoubleClickTab(tab.id, tab.title)}
            >
              <Terminal size={14} className="terminal-tab-icon" />
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  className="terminal-tab-rename-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveRename(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(tab.id);
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="terminal-tab-title">{tab.title}</span>
              )}
              <button
                className="terminal-tab-close-btn"
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
        <button
          className="terminal-new-tab-btn"
          title="New Terminal Tab"
          onClick={() => createNewTab()}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="terminal-header-actions">
        <button
          className="terminal-action-btn"
          title="Clear Output"
          onClick={clearActiveTabOutput}
        >
          <Trash2 size={14} />
        </button>
        <button
          className="terminal-action-btn"
          title={isFullscreen ? 'Restore Window' : 'Fullscreen'}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};
