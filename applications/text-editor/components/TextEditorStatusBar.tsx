/**
 * @file TextEditorStatusBar.tsx
 * @description Bottom status bar showing line:col, word count, character count, and autosave state.
 */

import React from 'react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorStatusBar: React.FC = () => {
  const { tabs, activeTabId, preferences } = useTextEditorStore();
  const currentTab = tabs.find((t) => t.id === activeTabId);

  if (!currentTab) return null;

  const text = currentTab.content;
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split('\n').length;

  return (
    <div className="te-status-bar">
      <div className="te-status-left">
        <span>Line {currentTab.cursorPos.line}, Col {currentTab.cursorPos.col}</span>
        <span className="te-status-sep">|</span>
        <span>{lineCount} lines</span>
        <span className="te-status-sep">|</span>
        <span>{wordCount} words</span>
        <span className="te-status-sep">|</span>
        <span>{charCount} characters</span>
      </div>

      <div className="te-status-right">
        {preferences.autosaveIntervalMs > 0 && (
          <span style={{ color: '#38bdf8' }}>Autosave: Enabled ({preferences.autosaveIntervalMs / 1000}s)</span>
        )}
        <span className="te-status-sep">|</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
