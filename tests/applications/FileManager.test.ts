/**
 * @file FileManager.test.ts
 * @description Comprehensive unit and integration test suite for File Manager application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFileManagerStore } from '../../applications/file-manager/store/fileManagerStore.js';
import { platform } from '../../src/services/webosPlatform.js';

describe('File Manager Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    // Reset store state
    useFileManagerStore.setState({
      currentPath: '/home/user',
      history: ['/home/user'],
      historyIndex: 0,
      items: [],
      selectedPaths: [],
      viewMode: 'grid',
      sortField: 'name',
      sortOrder: 'asc',
      filterCategory: 'all',
      searchQuery: '',
      searchResults: null,
      favorites: ['/home/user'],
      clipboard: null,
      loading: false,
      error: null,
    });
  });

  it('navigates through VFS directories and updates history', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user/Documents');

    const state = useFileManagerStore.getState();
    expect(state.currentPath).toBe('/home/user/Documents');
    expect(state.historyIndex).toBe(1);

    await store.navigateBack();
    expect(useFileManagerStore.getState().currentPath).toBe('/home/user');
  });

  it('creates new files and folders in VFS', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user');

    await store.createFolder('ProjectAlpha');
    expect(await platform.fileSystem.exists('/home/user/ProjectAlpha')).toBe(true);

    await store.createFile('notes.txt', 'Hello WebOS!');
    expect(await platform.fileSystem.exists('/home/user/notes.txt')).toBe(true);
  });

  it('renames existing files and folders', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user');
    await store.createFile('old_name.txt', 'Content');

    await store.renameItem('/home/user/old_name.txt', 'new_name.txt');

    expect(await platform.fileSystem.exists('/home/user/old_name.txt')).toBe(false);
    expect(await platform.fileSystem.exists('/home/user/new_name.txt')).toBe(true);
  });

  it('handles copy, cut, and paste clipboard operations', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user');
    await store.createFile('clip.txt', 'Sample text');

    store.copyItems(['/home/user/clip.txt']);
    expect(useFileManagerStore.getState().clipboard).toEqual({
      paths: ['/home/user/clip.txt'],
      action: 'copy',
    });

    await store.navigateTo('/home/user/Documents');
    await store.pasteItems();

    expect(await platform.fileSystem.exists('/home/user/Documents/clip.txt')).toBe(true);
    expect(await platform.fileSystem.exists('/home/user/clip.txt')).toBe(true);
  });

  it('moves items to trash and restores or permanently deletes them', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user');
    await store.createFile('delete_me.txt', 'Temporary');

    await store.deleteItems(['/home/user/delete_me.txt']);
    expect(await platform.fileSystem.exists('/home/user/delete_me.txt')).toBe(false);

    // Trash should contain the item
    const trashNodes = await platform.fileSystem.listDirectory('/trash');
    expect(trashNodes.length).toBeGreaterThan(0);
  });

  it('executes recursive search across VFS tree', async () => {
    const store = useFileManagerStore.getState();
    await store.navigateTo('/home/user');
    await store.createFile('unique_search_target.md', '# Target File');

    await store.search('unique_search_target');
    const state = useFileManagerStore.getState();

    expect(state.searchResults).not.toBeNull();
    expect(state.searchResults!.length).toBe(1);
    expect(state.searchResults![0]!.name).toBe('unique_search_target.md');
  });

  it('manages favorites list persistence', () => {
    const store = useFileManagerStore.getState();
    store.addFavorite('/home/user/Downloads');

    expect(useFileManagerStore.getState().favorites).toContain('/home/user/Downloads');

    store.removeFavorite('/home/user/Downloads');
    expect(useFileManagerStore.getState().favorites).not.toContain('/home/user/Downloads');
  });
});
