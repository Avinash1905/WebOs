import React, { useEffect } from 'react';
import { useCodeEditorStore } from './store/codeEditorStore.js';
import { EditorActivityBar } from './components/EditorActivityBar.js';
import { EditorFileExplorer } from './components/EditorFileExplorer.js';
import { EditorTabBar } from './components/EditorTabBar.js';
import { EditorArea } from './components/EditorArea.js';
import { EditorMinimap } from './components/EditorMinimap.js';
import { EditorSearchPanel } from './components/EditorSearchPanel.js';
import { EditorCommandPalette } from './components/EditorCommandPalette.js';
import { EditorIntegratedTerminal } from './components/EditorIntegratedTerminal.js';
import { EditorStatusBar } from './components/EditorStatusBar.js';
import { EditorSettingsModal } from './components/EditorSettingsModal.js';
import './codeEditor.css';

interface CodeEditorAppProps {
  windowId?: string;
  appId?: string;
  initialFilePath?: string;
}

export const CodeEditorApp: React.FC<CodeEditorAppProps> = ({ initialFilePath }) => {
  const {
    tabs,
    activeTabId,
    createNewFile,
    openFileInEditor,
    activeSidebarTab,
    isCommandPaletteOpen,
    saveActiveFile,
    closeTab,
    toggleCommandPalette,
    toggleIntegratedTerminal,
  } = useCodeEditorStore();

  useEffect(() => {
    if (initialFilePath) {
      openFileInEditor(initialFilePath);
    } else if (tabs.length === 0) {
      createNewFile();
    }
  }, [initialFilePath, createNewFile, openFileInEditor, tabs.length]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleGlobalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveActiveFile();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      createNewFile();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      toggleCommandPalette(true);
    } else if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      toggleIntegratedTerminal();
    }
  };

  return (
    <div className="code-editor-app" onKeyDown={handleGlobalKeyDown} tabIndex={0}>
      <div className="editor-main-layout">
        <EditorActivityBar />

        {activeSidebarTab === 'explorer' && (
          <div className="editor-sidebar-panel">
            <EditorFileExplorer />
          </div>
        )}

        {activeSidebarTab === 'search' && (
          <div className="editor-sidebar-panel">
            <EditorSearchPanel />
          </div>
        )}

        <div className="editor-center-pane">
          <EditorTabBar />

          {activeTab ? (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <EditorArea tab={activeTab} />
              <EditorMinimap content={activeTab.content} />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#858585',
              }}
            >
              No open documents. Press Ctrl+N to create a file or open from Explorer.
            </div>
          )}

          <EditorIntegratedTerminal />
          <EditorStatusBar tab={activeTab} />
        </div>
      </div>

      {isCommandPaletteOpen && <EditorCommandPalette />}
      <EditorSettingsModal />
    </div>
  );
};

export default CodeEditorApp;
