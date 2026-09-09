/**
 * @file applications/code-editor/types.ts
 * @description Interfaces and types for the WebOS Code Editor Application.
 */

export interface CodeEditorTab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  language: string;
  isDirty: boolean;
  readOnly: boolean;
  cursorPos: { line: number; col: number };
  selection: { startLine: number; startCol: number; endLine: number; endCol: number } | null;
  history: { past: string[]; future: string[] };
}

export interface CodeExplorerNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: CodeExplorerNode[];
  isExpanded?: boolean;
}

export interface CodeEditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  showMinimap: boolean;
  showLineNumbers: boolean;
  cursorStyle: 'line' | 'block' | 'underline';
  cursorBlinking: boolean;
  renderWhitespace: boolean;
  bracketPairColorization: boolean;
  theme: 'vs-dark' | 'vs-light' | 'monokai' | 'dracula';
  autosaveIntervalMs: number;
}

export interface CodeEditorCommand {
  id: string;
  title: string;
  category?: string;
  shortcut?: string;
  action: () => void;
}

export interface CodeEditorState {
  tabs: CodeEditorTab[];
  activeTabId: string | null;
  activeSidebarTab: 'explorer' | 'search' | 'settings' | null;
  workspaceRoot: string;
  fileTree: CodeExplorerNode[];
  searchParams: {
    findQuery: string;
    replaceQuery: string;
    matchCase: boolean;
    wholeWord: boolean;
    useRegex: boolean;
    resultsCount: number;
  };
  isCommandPaletteOpen: boolean;
  commandPaletteQuery: string;
  isIntegratedTerminalOpen: boolean;
  integratedTerminalHeight: number;
  settings: CodeEditorSettings;
  isSettingsModalOpen: boolean;
}

export interface CodeEditorActions {
  createNewFile: (title?: string, content?: string) => string;
  openFileInEditor: (filePath: string) => Promise<void>;
  closeTab: (tabId: string, force?: boolean) => boolean;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  reopenLastClosedTab: () => void;
  switchTab: (tabId: string) => void;
  updateActiveContent: (content: string) => void;
  saveActiveFile: () => Promise<boolean>;
  saveActiveFileAs: (targetPath: string) => Promise<boolean>;
  setCursorPos: (line: number, col: number) => void;
  undoActiveTab: () => void;
  redoActiveTab: () => void;
  setSidebarTab: (tab: 'explorer' | 'search' | 'settings' | null) => void;
  refreshFileExplorer: () => Promise<void>;
  setSearchParams: (params: Partial<CodeEditorState['searchParams']>) => void;
  executeFindReplace: (replaceMode?: boolean, replaceAll?: boolean) => void;
  toggleCommandPalette: (open?: boolean) => void;
  setCommandPaletteQuery: (query: string) => void;
  toggleIntegratedTerminal: (open?: boolean) => void;
  setIntegratedTerminalHeight: (height: number) => void;
  updateSettings: (update: Partial<CodeEditorSettings>) => void;
  setSettingsModalOpen: (open: boolean) => void;
}
