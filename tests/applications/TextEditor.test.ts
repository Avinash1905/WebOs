/**
 * @file TextEditor.test.ts
 * @description Comprehensive unit and integration test suite for Text Editor application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTextEditorStore } from '../../applications/text-editor/store/textEditorStore.js';
import { platform } from '../../src/services/webosPlatform.js';

describe('Text Editor Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    useTextEditorStore.setState({
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
      isPreferencesOpen: false,
      recoveryPromptTab: null,
    });
  });

  it('creates document tabs and switches active tab', () => {
    const store = useTextEditorStore.getState();
    const tab1 = store.createNewTab('Doc1.txt', 'Content 1');
    const tab2 = store.createNewTab('Doc2.txt', 'Content 2');

    let state = useTextEditorStore.getState();
    expect(state.tabs.length).toBe(2);
    expect(state.activeTabId).toBe(tab2);

    store.setActiveTab(tab1);
    state = useTextEditorStore.getState();
    expect(state.activeTabId).toBe(tab1);
  });

  it('updates document text and maintains undo/redo history', () => {
    const store = useTextEditorStore.getState();
    store.createNewTab('HistoryTest.txt', 'Initial');

    store.updateContent('Initial Line 1\n');
    store.updateContent('Initial Line 1\nLine 2');

    let state = useTextEditorStore.getState();
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId)!;
    expect(activeTab.content).toBe('Initial Line 1\nLine 2');
    expect(activeTab.isDirty).toBe(true);

    // Undo
    store.undo();
    expect(useTextEditorStore.getState().tabs[0]!.content).toBe('Initial Line 1\n');

    // Redo
    store.redo();
    expect(useTextEditorStore.getState().tabs[0]!.content).toBe('Initial Line 1\nLine 2');
  });

  it('saves documents to VFS and clears dirty flags', async () => {
    const store = useTextEditorStore.getState();
    store.createNewTab('SaveTest.txt', 'Saved content in VFS');

    await store.saveActiveDocumentAs('/home/user/Documents/SaveTest.txt');

    const state = useTextEditorStore.getState();
    expect(state.tabs[0]!.isDirty).toBe(false);
    expect(state.tabs[0]!.filePath).toBe('/home/user/Documents/SaveTest.txt');

    // Verify VFS file content
    const vfsContent = await platform.fileSystem.readFile('/home/user/Documents/SaveTest.txt', {
      encoding: 'utf-8',
    });
    expect(vfsContent).toBe('Saved content in VFS');
  });

  it('loads existing VFS files into tabs', async () => {
    await platform.fileSystem.createFile('/home/user/Documents/existing.txt', {
      content: 'VFS existing data',
    });

    const store = useTextEditorStore.getState();
    await store.openFileInEditor('/home/user/Documents/existing.txt');

    const state = useTextEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0]!.title).toBe('existing.txt');
    expect(state.tabs[0]!.content).toBe('VFS existing data');
  });

  it('updates editor preferences', () => {
    const store = useTextEditorStore.getState();
    store.updatePreferences({ fontSize: 18, lineWrapping: false });

    const prefs = useTextEditorStore.getState().preferences;
    expect(prefs.fontSize).toBe(18);
    expect(prefs.lineWrapping).toBe(false);
  });
});
