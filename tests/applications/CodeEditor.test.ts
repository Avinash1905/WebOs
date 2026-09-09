/**
 * @file CodeEditor.test.ts
 * @description Comprehensive unit & integration tests for WebOS Code Editor Application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCodeEditorStore } from '../../applications/code-editor/store/codeEditorStore.js';
import { detectLanguageFromPath, tokenizeLine } from '../../applications/code-editor/utils/syntaxHighlighter.js';
import { platform } from '../../src/services/webosPlatform.js';

describe('Code Editor Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    useCodeEditorStore.setState({
      tabs: [],
      activeTabId: null,
      activeSidebarTab: 'explorer',
      workspaceRoot: '/home/user',
      fileTree: [],
      isCommandPaletteOpen: false,
      isIntegratedTerminalOpen: false,
    });
  });

  it('detects programming language from file extension', () => {
    expect(detectLanguageFromPath('index.js')).toBe('javascript');
    expect(detectLanguageFromPath('App.tsx')).toBe('typescript');
    expect(detectLanguageFromPath('styles.css')).toBe('css');
    expect(detectLanguageFromPath('script.py')).toBe('python');
    expect(detectLanguageFromPath('main.c')).toBe('c');
    expect(detectLanguageFromPath('schema.sql')).toBe('sql');
  });

  it('tokenizes code lines for syntax highlighting', () => {
    const jsTokens = tokenizeLine('const count = 42;', 'javascript');
    expect(jsTokens.some((t) => t.type === 'keyword' && t.text === 'const')).toBe(true);
    expect(jsTokens.some((t) => t.type === 'number' && t.text === '42')).toBe(true);
  });

  it('manages editor document tabs, dirty state, and file opening', async () => {
    const store = useCodeEditorStore.getState();
    const tab1 = store.createNewFile('index.ts', 'const x = 100;');

    let state = useCodeEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0]!.title).toBe('index.ts');

    store.updateActiveContent('const x = 200;');
    state = useCodeEditorStore.getState();
    expect(state.tabs[0]!.isDirty).toBe(true);

    await store.saveActiveFileAs('/home/user/index.ts');
    expect(await platform.fileSystem.exists('/home/user/index.ts')).toBe(true);
    expect(useCodeEditorStore.getState().tabs[0]!.isDirty).toBe(false);

    store.closeTab(tab1, true);
    expect(useCodeEditorStore.getState().tabs.length).toBe(0);

    await store.openFileInEditor('/home/user/index.ts');
    state = useCodeEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0]!.content).toBe('const x = 200;');
  });

  it('executes find and replace in active document', () => {
    const store = useCodeEditorStore.getState();
    store.createNewFile('sample.js', 'function foo() { return foo; }');

    store.setSearchParams({ findQuery: 'foo', replaceQuery: 'bar', matchCase: true });
    store.executeFindReplace(true, true);

    const state = useCodeEditorStore.getState();
    expect(state.tabs[0]!.content).toBe('function bar() { return bar; }');
  });

  it('toggles command palette, integrated terminal, and settings modal', () => {
    const store = useCodeEditorStore.getState();

    store.toggleCommandPalette(true);
    expect(useCodeEditorStore.getState().isCommandPaletteOpen).toBe(true);

    store.toggleIntegratedTerminal(true);
    expect(useCodeEditorStore.getState().isIntegratedTerminalOpen).toBe(true);

    store.setSettingsModalOpen(true);
    expect(useCodeEditorStore.getState().isSettingsModalOpen).toBe(true);
  });
});
