/**
 * @file applications/terminal/store/terminalStore.ts
 * @description Isolated Zustand store for WebOS Terminal application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import type {
  TerminalState,
  TerminalActions,
  TerminalTabSession,
  TerminalOutputLine,
  TerminalPreferences,
} from '../types.js';

const STORAGE_PREFS_KEY = 'webos_terminal_preferences';

const DEFAULT_PREFS: TerminalPreferences = {
  fontSize: 14,
  fontFamily: 'Monospace, Consolas, Courier New',
  theme: 'dark',
  scrollbackLimit: 1000,
  autoScroll: true,
};

function loadSavedPrefs(): TerminalPreferences {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFS_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_PREFS;
}

export const useTerminalStore = create<TerminalState & TerminalActions>((set, get) => ({
  tabs: [],
  activeTabId: null,
  suggestions: [],
  selectedSuggestionIndex: -1,
  isHistorySearchOpen: false,
  historySearchQuery: '',
  isFullscreen: false,
  preferences: loadSavedPrefs(),

  createNewTab: (title = 'Terminal Session', initialCwd = '/home/user') => {
    const id = `term-tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTab: TerminalTabSession = {
      id,
      title,
      cwd: initialCwd,
      history: [],
      historyIndex: -1,
      outputLines: [
        {
          id: `line-${Date.now()}`,
          type: 'info',
          content: 'WebOS Terminal Shell v2.1.0\nType "help" to view available commands.\n',
          timestamp: Date.now(),
        },
      ],
      commandBuffer: '',
    };

    const updatedTabs = [...get().tabs, newTab];
    set({ tabs: updatedTabs, activeTabId: id, suggestions: [], selectedSuggestionIndex: -1 });
    return id;
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) {
      // If closing last tab, recreate a fresh tab
      const updated = tabs.filter((t) => t.id !== tabId);
      set({ tabs: updated, activeTabId: null });
      get().createNewTab();
      return;
    }

    const filtered = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      nextActiveId = filtered[filtered.length - 1]!.id;
    }
    set({ tabs: filtered, activeTabId: nextActiveId });
  },

  switchTab: (tabId: string) => {
    set({ activeTabId: tabId, suggestions: [], selectedSuggestionIndex: -1 });
  },

  renameTab: (tabId: string, title: string) => {
    if (!title.trim()) return;
    const { tabs } = get();
    const updated = tabs.map((t) => (t.id === tabId ? { ...t, title: title.trim() } : t));
    set({ tabs: updated });
  },

  updateCommandBuffer: (text: string) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const updated = tabs.map((t) => (t.id === activeTabId ? { ...t, commandBuffer: text } : t));
    set({ tabs: updated, suggestions: [], selectedSuggestionIndex: -1 });
  },

  executeCommandInActiveTab: async (commandLine: string) => {
    const { tabs, activeTabId, preferences } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    const rawLine = commandLine.trim();

    // Prompt output line
    const promptLine: TerminalOutputLine = {
      id: `prompt-${Date.now()}`,
      type: 'prompt',
      content: `webos@user:${currentTab.cwd}$ ${rawLine}`,
      timestamp: Date.now(),
    };

    let updatedOutput = [...currentTab.outputLines, promptLine];

    if (!rawLine) {
      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId
          ? { ...t, commandBuffer: '', outputLines: updatedOutput, historyIndex: -1 }
          : t
      );
      set({ tabs: updatedTabs, suggestions: [], selectedSuggestionIndex: -1 });
      return;
    }

    // Execute via Member 2 Shell
    const shell = platform.shell;
    await shell.setCwd(currentTab.cwd);
    const res = await shell.executeCommand(rawLine, currentTab.cwd);

    if (res.clearTerminal) {
      updatedOutput = [];
    } else {
      if (res.error) {
        updatedOutput.push({
          id: `err-${Date.now()}`,
          type: 'error',
          content: res.error,
          timestamp: Date.now(),
        });
      }
      if (res.output) {
        updatedOutput.push({
          id: `out-${Date.now()}`,
          type: res.code === 0 ? 'success' : 'text',
          content: res.output,
          timestamp: Date.now(),
        });
      }
    }

    // Apply scrollback limit
    if (updatedOutput.length > preferences.scrollbackLimit) {
      updatedOutput = updatedOutput.slice(updatedOutput.length - preferences.scrollbackLimit);
    }

    const newCwd = res.newCwd || shell.getCwd();
    const updatedHistory = [...currentTab.history.filter((h) => h !== rawLine), rawLine];

    const updatedTabs = tabs.map((t) =>
      t.id === activeTabId
        ? {
            ...t,
            cwd: newCwd,
            history: updatedHistory,
            historyIndex: -1,
            commandBuffer: '',
            outputLines: updatedOutput,
          }
        : t
    );

    set({ tabs: updatedTabs, suggestions: [], selectedSuggestionIndex: -1 });
  },

  navigateHistory: (direction: 'up' | 'down') => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || currentTab.history.length === 0) return;

    let nextIndex = currentTab.historyIndex;
    if (direction === 'up') {
      if (nextIndex === -1) {
        nextIndex = currentTab.history.length - 1;
      } else if (nextIndex > 0) {
        nextIndex--;
      }
    } else {
      if (nextIndex !== -1) {
        if (nextIndex < currentTab.history.length - 1) {
          nextIndex++;
        } else {
          nextIndex = -1;
        }
      }
    }

    const newBuffer = nextIndex !== -1 ? currentTab.history[nextIndex] || '' : '';
    const updatedTabs = tabs.map((t) =>
      t.id === activeTabId
        ? { ...t, historyIndex: nextIndex, commandBuffer: newBuffer }
        : t
    );
    set({ tabs: updatedTabs });
  },

  triggerAutocomplete: async () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab || !currentTab.commandBuffer) return;

    const suggestions = await platform.shell.autocomplete(currentTab.commandBuffer);
    if (suggestions.length === 1) {
      get().selectSuggestion(suggestions[0]!);
    } else {
      set({ suggestions, selectedSuggestionIndex: suggestions.length > 0 ? 0 : -1 });
    }
  },

  selectSuggestion: (suggestion) => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    const buffer = currentTab.commandBuffer;
    const parts = buffer.trimStart().split(/\s+/);

    let newBuffer = '';
    if (parts.length <= 1) {
      newBuffer = suggestion.text;
    } else {
      parts.pop();
      newBuffer = `${parts.join(' ')} ${suggestion.text}`;
    }

    const updatedTabs = tabs.map((t) =>
      t.id === activeTabId ? { ...t, commandBuffer: newBuffer } : t
    );
    set({ tabs: updatedTabs, suggestions: [], selectedSuggestionIndex: -1 });
  },

  clearActiveTabOutput: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const updated = tabs.map((t) => (t.id === activeTabId ? { ...t, outputLines: [] } : t));
    set({ tabs: updated });
  },

  toggleHistorySearch: (open) => {
    const nextState = open !== undefined ? open : !get().isHistorySearchOpen;
    set({ isHistorySearchOpen: nextState, historySearchQuery: '' });
  },

  setHistorySearchQuery: (query) => {
    set({ historySearchQuery: query });
  },

  toggleFullscreen: () => {
    set({ isFullscreen: !get().isFullscreen });
  },

  updatePreferences: (update) => {
    const updated = { ...get().preferences, ...update };
    set({ preferences: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
    }
  },
}));
