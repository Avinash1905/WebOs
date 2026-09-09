/**
 * @file types.ts
 * @description Types and data contracts for WebOS Text Editor.
 */

export interface TextDocumentTab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  isDirty: boolean;
  readOnly: boolean;
  history: {
    past: string[];
    future: string[];
  };
  cursorPos: { line: number; col: number };
}

export interface TextEditorPreferences {
  fontSize: number;
  fontFamily: 'Monospace' | 'Sans-Serif' | 'Serif';
  lineWrapping: boolean;
  lineNumbers: boolean;
  tabSize: number;
  indentWithSpaces: boolean;
  showWhitespace: boolean;
  autosaveIntervalMs: number; // 0 = disabled
}

export interface TextEditorFindReplaceState {
  findQuery: string;
  replaceQuery: string;
  matchCase: boolean;
  wholeWord: boolean;
  matchesCount: number;
  currentMatchIndex: number;
  isOpen: boolean;
}

export interface TextEditorState {
  tabs: TextDocumentTab[];
  activeTabId: string | null;
  findReplace: TextEditorFindReplaceState;
  preferences: TextEditorPreferences;
  isPreferencesOpen: boolean;
  recoveryPromptTab: TextDocumentTab | null;
}

export interface TextEditorActions {
  createNewTab: (title?: string, initialContent?: string, filePath?: string | null) => string;
  closeTab: (tabId: string, force?: boolean) => boolean;
  setActiveTab: (tabId: string) => void;
  
  updateContent: (content: string) => void;
  saveActiveDocument: () => Promise<void>;
  saveActiveDocumentAs: (newPath: string) => Promise<void>;
  openFileInEditor: (filePath: string) => Promise<void>;
  
  undo: () => void;
  redo: () => void;
  
  setCursorPos: (line: number, col: number) => void;
  setFindReplaceState: (update: Partial<TextEditorFindReplaceState>) => void;
  toggleFindReplace: () => void;
  
  updatePreferences: (update: Partial<TextEditorPreferences>) => void;
  setPreferencesOpen: (open: boolean) => void;
  
  restoreRecoverySnapshot: () => void;
  dismissRecoveryPrompt: () => void;
}
