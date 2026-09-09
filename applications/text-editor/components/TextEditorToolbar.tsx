/**
 * @file TextEditorToolbar.tsx
 * @description Action toolbar for File CRUD, Undo/Redo history, Find/Replace, and Preferences.
 */

import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo,
  Redo,
  Search,
  Settings,
} from 'lucide-react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorToolbar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    createNewTab,
    saveActiveDocument,
    saveActiveDocumentAs,
    openFileInEditor,
    undo,
    redo,
    toggleFindReplace,
    setPreferencesOpen,
  } = useTextEditorStore();

  const currentTab = tabs.find((t) => t.id === activeTabId);
  const canUndo = currentTab ? currentTab.history.past.length > 0 : false;
  const canRedo = currentTab ? currentTab.history.future.length > 0 : false;

  const handleOpenClick = () => {
    const filePath = window.prompt('Enter file path to open:', '/home/user/Documents/sample.txt');
    if (filePath && filePath.trim()) {
      openFileInEditor(filePath.trim());
    }
  };

  const handleSaveAsClick = () => {
    if (!currentTab) return;
    const defaultPath = currentTab.filePath || `/home/user/Documents/${currentTab.title}`;
    const newPath = window.prompt('Save File As:', defaultPath);
    if (newPath && newPath.trim()) {
      saveActiveDocumentAs(newPath.trim());
    }
  };

  return (
    <div className="te-toolbar">
      <div className="te-toolbar-group">
        <button className="te-btn" onClick={() => createNewTab()} title="New File (Ctrl+N)">
          <FilePlus size={15} />
          <span>New</span>
        </button>
        <button className="te-btn" onClick={handleOpenClick} title="Open File (Ctrl+O)">
          <FolderOpen size={15} />
          <span>Open</span>
        </button>
        <button
          className="te-btn te-btn-accent"
          disabled={!currentTab || !currentTab.isDirty}
          onClick={() => saveActiveDocument()}
          title="Save File (Ctrl+S)"
        >
          <Save size={15} />
          <span>Save</span>
        </button>
        <button
          className="te-btn"
          disabled={!currentTab}
          onClick={handleSaveAsClick}
          title="Save As (Ctrl+Shift+S)"
        >
          <span>Save As...</span>
        </button>
      </div>

      <div className="te-toolbar-divider" />

      <div className="te-toolbar-group">
        <button
          className="te-btn te-btn-icon"
          disabled={!canUndo}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={15} />
        </button>
        <button
          className="te-btn te-btn-icon"
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={15} />
        </button>
      </div>

      <div className="te-toolbar-divider" />

      <div className="te-toolbar-group">
        <button
          className="te-btn te-btn-icon"
          onClick={toggleFindReplace}
          title="Find & Replace (Ctrl+F)"
        >
          <Search size={15} />
        </button>
      </div>

      <div className="te-toolbar-spacer" />

      <div className="te-toolbar-group">
        <button
          className="te-btn te-btn-icon"
          onClick={() => setPreferencesOpen(true)}
          title="Editor Preferences"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
};
