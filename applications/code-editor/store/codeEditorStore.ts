/**
 * @file applications/code-editor/store/codeEditorStore.ts
 * @description Isolated Zustand store for WebOS Code Editor application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import { detectLanguageFromPath } from '../utils/syntaxHighlighter.js';
import type {
  CodeEditorState,
  CodeEditorActions,
  CodeEditorTab,
  CodeExplorerNode,
  CodeEditorSettings,
} from '../types.js';

const STORAGE_PREFS_KEY = 'webos_code_editor_settings';

const DEFAULT_SETTINGS: CodeEditorSettings = {
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Monospace',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: false,
  showMinimap: true,
  showLineNumbers: true,
  cursorStyle: 'line',
  cursorBlinking: true,
  renderWhitespace: false,
  bracketPairColorization: true,
  theme: 'vs-dark',
  autosaveIntervalMs: 5000,
};

function loadSavedSettings(): CodeEditorSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

let lastClosedTabStack: CodeEditorTab[] = [];

export const useCodeEditorStore = create<CodeEditorState & CodeEditorActions>((set, get) => ({
  tabs: [],
  activeTabId: null,
  activeSidebarTab: 'explorer',
  workspaceRoot: '/home/user',
  fileTree: [],
  searchParams: {
    findQuery: '',
    replaceQuery: '',
    matchCase: false,
    wholeWord: false,
    useRegex: false,
    resultsCount: 0,
  },
  isCommandPaletteOpen: false,
  commandPaletteQuery: '',
  isIntegratedTerminalOpen: false,
  integratedTerminalHeight: 200,
  settings: loadSavedSettings(),
  isSettingsModalOpen: false,

  createNewFile: (title = 'Untitled.ts', content = '') => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTab: CodeEditorTab = {
      id,
      title,
      filePath: null,
      content,
      language: detectLanguageFromPath(title),
      isDirty: false,
      readOnly: false,
      cursorPos: { line: 1, col: 1 },
      selection: null,
      history: { past: [], future: [] },
    };

    const updated = [...get().tabs, newTab];
    set({ tabs: updated, activeTabId: id });
    return id;
  },

  openFileInEditor: async (filePath: string) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.filePath === filePath);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    try {
      await platform.initialize();
      const content = String(await platform.fileSystem.readFile(filePath, { encoding: 'utf-8' }));
      const fileName = filePath.split('/').pop() || 'Untitled';
      const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const newTab: CodeEditorTab = {
        id,
        title: fileName,
        filePath,
        content,
        language: detectLanguageFromPath(filePath),
        isDirty: false,
        readOnly: false,
        cursorPos: { line: 1, col: 1 },
        selection: null,
        history: { past: [], future: [] },
      };

      set({ tabs: [...tabs, newTab], activeTabId: id });
    } catch (err: any) {
      console.error('[CodeEditor] Failed to open file:', err);
    }
  },

  closeTab: (tabId: string, force = false) => {
    const { tabs, activeTabId } = get();
    const target = tabs.find((t) => t.id === tabId);
    if (!target) return true;

    if (target.isDirty && !force) {
      if (typeof window !== 'undefined' && !window.confirm(`Save changes to "${target.title}"?`)) {
        return false;
      }
    }

    lastClosedTabStack.push(target);
    const filtered = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      nextActiveId = filtered.length > 0 ? filtered[filtered.length - 1]!.id : null;
    }
    set({ tabs: filtered, activeTabId: nextActiveId });
    return true;
  },

  closeOtherTabs: (tabId: string) => {
    const { tabs } = get();
    const target = tabs.find((t) => t.id === tabId);
    if (target) {
      set({ tabs: [target], activeTabId: tabId });
    }
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  reopenLastClosedTab: () => {
    if (lastClosedTabStack.length > 0) {
      const restored = lastClosedTabStack.pop()!;
      set({ tabs: [...get().tabs, restored], activeTabId: restored.id });
    }
  },

  switchTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateActiveContent: (content: string) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    const past = [...currentTab.history.past, currentTab.content].slice(-50);
    const updatedTab: CodeEditorTab = {
      ...currentTab,
      content,
      isDirty: true,
      history: { past, future: [] },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });
  },

  saveActiveFile: async () => {
    const { tabs, activeTabId, saveActiveFileAs } = get();
    if (!activeTabId) return false;

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return false;

    if (!activeTab.filePath) {
      const defaultPath = `/home/user/${activeTab.title}`;
      return await saveActiveFileAs(defaultPath);
    }

    try {
      await platform.fileSystem.createFile(activeTab.filePath, {
        content: activeTab.content,
        overwrite: true,
      });

      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId ? { ...t, isDirty: false } : t
      );
      set({ tabs: updatedTabs });
      await get().refreshFileExplorer();
      return true;
    } catch (err: any) {
      console.error('[CodeEditor] Save failed:', err);
      return false;
    }
  },

  saveActiveFileAs: async (targetPath: string) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return false;

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return false;

    try {
      await platform.fileSystem.createFile(targetPath, {
        content: activeTab.content,
        overwrite: true,
      });

      const fileName = targetPath.split('/').pop() || activeTab.title;
      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: fileName,
              filePath: targetPath,
              language: detectLanguageFromPath(targetPath),
              isDirty: false,
            }
          : t
      );

      set({ tabs: updatedTabs });
      await get().refreshFileExplorer();
      return true;
    } catch (err: any) {
      console.error('[CodeEditor] Save As failed:', err);
      return false;
    }
  },

  setCursorPos: (line, col) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const updatedTabs = tabs.map((t) =>
      t.id === activeTabId ? { ...t, cursorPos: { line, col } } : t
    );
    set({ tabs: updatedTabs });
  },

  undoActiveTab: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.history.past.length === 0) return;

    const past = [...currentTab.history.past];
    const prevContent = past.pop()!;
    const future = [currentTab.content, ...currentTab.history.future];

    const updatedTab: CodeEditorTab = {
      ...currentTab,
      content: prevContent,
      isDirty: true,
      history: { past, future },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });
  },

  redoActiveTab: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.history.future.length === 0) return;

    const future = [...currentTab.history.future];
    const nextContent = future.shift()!;
    const past = [...currentTab.history.past, currentTab.content];

    const updatedTab: CodeEditorTab = {
      ...currentTab,
      content: nextContent,
      isDirty: true,
      history: { past, future },
    };

    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updatedTab : t));
    set({ tabs: updatedTabs });
  },

  setSidebarTab: (tab) => {
    set({ activeSidebarTab: get().activeSidebarTab === tab ? null : tab });
  },

  refreshFileExplorer: async () => {
    const { workspaceRoot } = get();
    try {
      await platform.initialize();

      const buildTree = async (dirPath: string): Promise<CodeExplorerNode[]> => {
        const items = await platform.fileSystem.listDirectory(dirPath, { includeHidden: false });
        const nodes: CodeExplorerNode[] = [];

        for (const item of items) {
          const isDir = item.type === 'directory';
          const node: CodeExplorerNode = {
            id: item.id,
            name: item.name,
            path: item.path,
            type: item.type,
            isExpanded: isDir ? false : undefined,
          };
          nodes.push(node);
        }
        return nodes;
      };

      const tree = await buildTree(workspaceRoot);
      set({ fileTree: tree });
    } catch (err) {
      console.warn('[CodeEditor] File tree refresh failed:', err);
    }
  },

  setSearchParams: (params) => {
    set({ searchParams: { ...get().searchParams, ...params } });
  },

  executeFindReplace: (replaceMode = false, replaceAll = false) => {
    const { tabs, activeTabId, searchParams, updateActiveContent } = get();
    if (!activeTabId) return;
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || !searchParams.findQuery) return;

    const { findQuery, replaceQuery, matchCase } = searchParams;
    const flag = matchCase ? 'g' : 'gi';

    if (replaceMode && replaceAll) {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flag);
      const newContent = currentTab.content.replace(regex, replaceQuery);
      updateActiveContent(newContent);
    }
  },

  toggleCommandPalette: (open) => {
    set({ isCommandPaletteOpen: open !== undefined ? open : !get().isCommandPaletteOpen });
  },

  setCommandPaletteQuery: (query) => {
    set({ commandPaletteQuery: query });
  },

  toggleIntegratedTerminal: (open) => {
    set({
      isIntegratedTerminalOpen:
        open !== undefined ? open : !get().isIntegratedTerminalOpen,
    });
  },

  setIntegratedTerminalHeight: (height) => {
    set({ integratedTerminalHeight: height });
  },

  updateSettings: (update) => {
    const updated = { ...get().settings, ...update };
    set({ settings: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
    }
  },

  setSettingsModalOpen: (open) => {
    set({ isSettingsModalOpen: open });
  },
}));
