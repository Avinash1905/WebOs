/**
 * @file applications/terminal/types.ts
 * @description Types and interfaces for the WebOS Terminal Application.
 */

import type { AutocompleteSuggestion } from '../../core/shell/types.js';

export interface TerminalOutputLine {
  id: string;
  type: 'prompt' | 'text' | 'error' | 'success' | 'warning' | 'table' | 'info';
  content: string;
  timestamp: number;
  data?: any;
}

export interface TerminalTabSession {
  id: string;
  title: string;
  cwd: string;
  history: string[];
  historyIndex: number;
  outputLines: TerminalOutputLine[];
  commandBuffer: string;
}

export interface TerminalPreferences {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'matrix' | 'dracula' | 'light';
  scrollbackLimit: number;
  autoScroll: boolean;
}

export interface TerminalState {
  tabs: TerminalTabSession[];
  activeTabId: string | null;
  suggestions: AutocompleteSuggestion[];
  selectedSuggestionIndex: number;
  isHistorySearchOpen: boolean;
  historySearchQuery: string;
  isFullscreen: boolean;
  preferences: TerminalPreferences;
}

export interface TerminalActions {
  createNewTab: (title?: string, initialCwd?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  renameTab: (tabId: string, title: string) => void;
  executeCommandInActiveTab: (commandLine: string) => Promise<void>;
  updateCommandBuffer: (text: string) => void;
  navigateHistory: (direction: 'up' | 'down') => void;
  triggerAutocomplete: () => Promise<void>;
  selectSuggestion: (suggestion: AutocompleteSuggestion) => void;
  clearActiveTabOutput: () => void;
  toggleHistorySearch: (open?: boolean) => void;
  setHistorySearchQuery: (query: string) => void;
  toggleFullscreen: () => void;
  updatePreferences: (pref: Partial<TerminalPreferences>) => void;
}
