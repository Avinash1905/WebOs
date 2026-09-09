import React from 'react';
import { Folder, Search, Sliders, Terminal, Settings } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';

export const EditorActivityBar: React.FC = () => {
  const {
    activeSidebarTab,
    setSidebarTab,
    toggleCommandPalette,
    toggleIntegratedTerminal,
    isIntegratedTerminalOpen,
    setSettingsModalOpen,
  } = useCodeEditorStore();

  return (
    <div className="editor-activity-bar">
      <div className="activity-top-group">
        <button
          className={`activity-btn ${activeSidebarTab === 'explorer' ? 'active' : ''}`}
          title="Explorer (Ctrl+Shift+E)"
          onClick={() => setSidebarTab('explorer')}
        >
          <Folder size={20} />
        </button>

        <button
          className={`activity-btn ${activeSidebarTab === 'search' ? 'active' : ''}`}
          title="Search & Replace (Ctrl+Shift+F)"
          onClick={() => setSidebarTab('search')}
        >
          <Search size={20} />
        </button>

        <button
          className="activity-btn"
          title="Command Palette (Ctrl+Shift+P)"
          onClick={() => toggleCommandPalette(true)}
        >
          <Sliders size={20} />
        </button>

        <button
          className={`activity-btn ${isIntegratedTerminalOpen ? 'active' : ''}`}
          title="Toggle Integrated Terminal (Ctrl+`)"
          onClick={() => toggleIntegratedTerminal()}
        >
          <Terminal size={20} />
        </button>
      </div>

      <div className="activity-bottom-group">
        <button
          className="activity-btn"
          title="Editor Settings"
          onClick={() => setSettingsModalOpen(true)}
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};
