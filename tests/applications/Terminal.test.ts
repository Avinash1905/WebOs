/**
 * @file Terminal.test.ts
 * @description Comprehensive unit & integration tests for WebOS Terminal Application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTerminalStore } from '../../applications/terminal/store/terminalStore.js';
import { platform } from '../../src/services/webosPlatform.js';

describe('Terminal Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    useTerminalStore.setState({
      tabs: [],
      activeTabId: null,
      suggestions: [],
      selectedSuggestionIndex: -1,
      isHistorySearchOpen: false,
      historySearchQuery: '',
      isFullscreen: false,
    });
  });

  it('manages terminal tabs lifecycle', () => {
    const store = useTerminalStore.getState();
    const tab1 = store.createNewTab('Session 1', '/home/user');
    const tab2 = store.createNewTab('Session 2', '/home/user/Documents');

    let state = useTerminalStore.getState();
    expect(state.tabs.length).toBe(2);
    expect(state.activeTabId).toBe(tab2);

    store.switchTab(tab1);
    expect(useTerminalStore.getState().activeTabId).toBe(tab1);

    store.renameTab(tab1, 'Main Shell');
    expect(useTerminalStore.getState().tabs.find((t) => t.id === tab1)?.title).toBe('Main Shell');

    store.closeTab(tab2);
    state = useTerminalStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.activeTabId).toBe(tab1);
  });

  it('executes commands in active tab and appends output lines', async () => {
    const store = useTerminalStore.getState();
    store.createNewTab('Shell', '/home/user');

    await store.executeCommandInActiveTab('echo "Hello Terminal"');

    const state = useTerminalStore.getState();
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
    expect(activeTab).toBeDefined();

    const outputTexts = activeTab!.outputLines.map((l) => l.content);
    expect(outputTexts.some((t) => t.includes('Hello Terminal'))).toBe(true);
  });

  it('navigates command history with up/down arrows', async () => {
    const store = useTerminalStore.getState();
    store.createNewTab('Shell', '/home/user');

    await store.executeCommandInActiveTab('pwd');
    await store.executeCommandInActiveTab('whoami');

    store.navigateHistory('up');
    expect(useTerminalStore.getState().tabs[0]?.commandBuffer).toBe('whoami');

    store.navigateHistory('up');
    expect(useTerminalStore.getState().tabs[0]?.commandBuffer).toBe('pwd');

    store.navigateHistory('down');
    expect(useTerminalStore.getState().tabs[0]?.commandBuffer).toBe('whoami');
  });

  it('triggers autocomplete and selects suggestions', async () => {
    const store = useTerminalStore.getState();
    store.createNewTab('Shell', '/home/user');
    store.updateCommandBuffer('cd Doc');

    await store.triggerAutocomplete();

    const state = useTerminalStore.getState();
    expect(state.tabs[0]?.commandBuffer).toContain('Documents');
  });

  it('toggles history search modal and clears output', () => {
    const store = useTerminalStore.getState();
    store.createNewTab('Shell', '/home/user');

    store.toggleHistorySearch(true);
    expect(useTerminalStore.getState().isHistorySearchOpen).toBe(true);

    store.clearActiveTabOutput();
    expect(useTerminalStore.getState().tabs[0]?.outputLines.length).toBe(0);
  });
});
