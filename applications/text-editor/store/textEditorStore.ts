/**
 * @file textEditorStore.ts
 * @description Isolated Zustand store for WebOS Text Editor application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import type {
  TextEditorState,
  TextEditorActions,
  TextDocumentTab,
  TextEditorPreferences,
} from '../types.js';

const STORAGE_PREFS_KEY = 'webos_text_editor_prefs';
const RECOVERY_STORAGE_NS = 'text_editor_recovery';

const DEFAULT_PREFS: TextEditorPreferences = {
  fontSize: 14,
  fontFamily: 'Monospace',
  lineWrapping: true,
  lineNumbers: true,
  tabSize: 2,
  indentWithSpaces: true,
  showWhitespace: false,
  autosaveIntervalMs: 5000,
};

function loadSavedPrefs(): TextEditorPreferences {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFS_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_PREFS;
}

const initialPrefs = loadSavedPrefs();

let autosaveTimer: any = null;

export const useTextEditorStore = create<TextEditorState & TextEditorActions>((set, get) => ({
  tabs: [],
  activeTabId: null,
  findReplace: {
    findQuery: '',
    replaceQuery: '',
    matchCase: false,
    wholeWord: false,
    matchesCount: 0,
    currentMatchIndex: 0,
    isOpen: false,
  },
  preferences: initialPrefs,
  isPreferencesOpen: false,
  recoveryPromptTab: null,

  createNewTab: (title = 'Untitled.txt', initialContent = '', filePath = null) => {
    const newTab: TextDocumentTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      filePath,
      content: initialContent,
      isDirty: false,
      readOnly: false,
      history: { past: [], future: [] },
      cursorPos: { line: 1, col: 1 },
    };

    const updatedTabs = [...get().tabs, newTab];
    set({ tabs: updatedTabs, activeTabId: newTab.id });
    return newTab.id;
  },

  closeTab: (tabId: string, force = false) => {
    const { tabs, activeTabId } = get();
    const tabToClose = tabs.find((t) => t.id === tabId);
    if (!tabToClose) return true;

    if (tabToClose.isDirty && !force) {
      if (!window.confirm(`Save changes to "${tabToClose.title}" before closing?`)) {
        // User cancelled close or refused discard
        return false;
      }
    }

    const filtered = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;

    if (activeTabId === tabId) {
      if (filtered.length > 0) {
        nextActiveId = filtered[filtered.length - 1]!.id;
      } else {
        nextActiveId = null;
      }
    }

    set({ tabs: filtered, activeTabId: nextActiveId });
    return true;
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateContent: (newContent: string) => {
    const { tabs, activeTabId, preferences } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.readOnly || currentTab.content === newContent) return;

    // Push past history snapshot
    const past = [...currentTab.history.past, currentTab.content].slice(-50);
    const updatedTab: TextDocumentTab = {
      ...currentTab,
      content: newContent,
      isDirty: true,
      history: { past, future: [] },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });

    // Handle autosave
    if (preferences.autosaveIntervalMs > 0 && updatedTab.filePath) {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(async () => {
        await get().saveActiveDocument();
      }, preferences.autosaveIntervalMs);
    }
  },

  saveActiveDocument: async () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    if (!currentTab.filePath) {
      // Prompt filename
      const filename = window.prompt('Save file as (enter path):', `/home/user/Documents/${currentTab.title}`);
      if (!filename) return;
      await get().saveActiveDocumentAs(filename);
      return;
    }

    try {
      await platform.initialize();
      await platform.fileSystem.createFile(currentTab.filePath, {
        content: currentTab.content,
        overwrite: true,
      });

      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId ? { ...t, isDirty: false } : t
      );
      set({ tabs: updatedTabs });
    } catch (err: any) {
      alert(`Save failed: ${err?.message || 'Unknown error'}`);
    }
  },

  saveActiveDocumentAs: async (newPath: string) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    try {
      await platform.initialize();
      await platform.fileSystem.createFile(newPath, {
        content: currentTab.content,
        overwrite: true,
      });

      const fileName = newPath.split('/').pop() || 'Untitled.txt';

      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId
          ? { ...t, filePath: newPath, title: fileName, isDirty: false }
          : t
      );
      set({ tabs: updatedTabs });
    } catch (err: any) {
      alert(`Save As failed: ${err?.message || 'Unknown error'}`);
    }
  },

  openFileInEditor: async (filePath: string) => {
    try {
      await platform.initialize();
      const fs = platform.fileSystem;

      const exists = await fs.exists(filePath);
      if (!exists) throw new Error(`File '${filePath}' does not exist.`);

      const content = await fs.readFile(filePath, { encoding: 'utf-8' });
      const title = filePath.split('/').pop() || 'File';

      // Check if already open in tabs
      const existingTab = get().tabs.find((t) => t.filePath === filePath);
      if (existingTab) {
        set({ activeTabId: existingTab.id });
        return;
      }

      get().createNewTab(title, String(content), filePath);
    } catch (err: any) {
      alert(`Open failed: ${err?.message || 'Unknown error'}`);
    }
  },

  undo: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.history.past.length === 0) return;

    const past = [...currentTab.history.past];
    const previousState = past.pop()!;
    const future = [currentTab.content, ...currentTab.history.future];

    const updatedTab: TextDocumentTab = {
      ...currentTab,
      content: previousState,
      isDirty: true,
      history: { past, future },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });
  },

  redo: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.history.future.length === 0) return;

    const future = [...currentTab.history.future];
    const nextState = future.shift()!;
    const past = [...currentTab.history.past, currentTab.content];

    const updatedTab: TextDocumentTab = {
      ...currentTab,
      content: nextState,
      isDirty: true,
      history: { past, future },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });
  },

  setCursorPos: (line, col) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const updatedTabs = tabs.map((t) =>
      t.id === activeTabId ? { ...t, cursorPos: { line, col } } : t
    );
    set({ tabs: updatedTabs });
  },

  setFindReplaceState: (update) => {
    set({ findReplace: { ...get().findReplace, ...update } });
  },

  toggleFindReplace: () => {
    const { findReplace } = get();
    set({ findReplace: { ...findReplace, isOpen: !findReplace.isOpen } });
  },

  updatePreferences: (update) => {
    const updated = { ...get().preferences, ...update };
    set({ preferences: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
    }
  },

  setPreferencesOpen: (open) => set({ isPreferencesOpen: open }),

  restoreRecoverySnapshot: () => {
    const { recoveryPromptTab, tabs } = get();
    if (recoveryPromptTab) {
      set({
        tabs: [...tabs, recoveryPromptTab],
        activeTabId: recoveryPromptTab.id,
        recoveryPromptTab: null,
      });
    }
  },

  dismissRecoveryPrompt: () => set({ recoveryPromptTab: null }),
}));
