import React from 'react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';
import type { CodeEditorTab } from '../types.js';

interface EditorStatusBarProps {
  tab: CodeEditorTab | undefined;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({ tab }) => {
  const { settings, toggleIntegratedTerminal, isIntegratedTerminalOpen } = useCodeEditorStore();

  const line = tab?.cursorPos.line || 1;
  const col = tab?.cursorPos.col || 1;
  const lang = tab?.language || 'plaintext';

  return (
    <div className="editor-status-bar">
      <div className="status-left">
        <button
          className={`status-item ${isIntegratedTerminalOpen ? 'active' : ''}`}
          onClick={() => toggleIntegratedTerminal()}
        >
          Terminal
        </button>
        {tab?.filePath && <span className="status-item path-item">{tab.filePath}</span>}
      </div>

      <div className="status-right">
        <span className="status-item">Ln {line}, Col {col}</span>
        <span className="status-item">Spaces: {settings.tabSize}</span>
        <span className="status-item">UTF-8</span>
        <span className="status-item lang-item">{lang.toUpperCase()}</span>
      </div>
    </div>
  );
};
