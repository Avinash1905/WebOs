/**
 * @file TextEditorApp.tsx
 * @description Main application container for WebOS Text Editor.
 */

import React, { useEffect } from 'react';
import { useTextEditorStore } from './store/textEditorStore.js';
import { TextEditorTabBar } from './components/TextEditorTabBar.js';
import { TextEditorToolbar } from './components/TextEditorToolbar.js';
import { TextEditorFindReplace } from './components/TextEditorFindReplace.js';
import { TextEditorArea } from './components/TextEditorArea.js';
import { TextEditorStatusBar } from './components/TextEditorStatusBar.js';
import { TextEditorPreferencesModal } from './components/TextEditorPreferencesModal.js';
import './textEditor.css';

export interface TextEditorAppProps {
  windowId?: string;
  appId?: string;
  initialFilePath?: string;
}

export const TextEditorApp: React.FC<TextEditorAppProps> = ({ initialFilePath }) => {
  const { tabs, createNewTab, openFileInEditor } = useTextEditorStore();

  useEffect(() => {
    if (initialFilePath) {
      openFileInEditor(initialFilePath);
    } else if (tabs.length === 0) {
      createNewTab('Untitled.txt', '');
    }
  }, [initialFilePath]);

  return (
    <div className="te-app">
      {/* Document Tabs */}
      <TextEditorTabBar />

      {/* Main Action Toolbar */}
      <TextEditorToolbar />

      {/* Find & Replace Panel */}
      <TextEditorFindReplace />

      {/* Multiline Editor Canvas */}
      <TextEditorArea />

      {/* Status Bar */}
      <TextEditorStatusBar />

      {/* Preferences Modal */}
      <TextEditorPreferencesModal />
    </div>
  );
};

export default TextEditorApp;
