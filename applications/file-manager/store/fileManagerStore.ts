/**
 * @file fileManagerStore.ts
 * @description Isolated Zustand store for WebOS File Manager application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import type { FileMetadata } from '../../../core/filesystem/types.js';
import type {
  FileManagerState,
  FileManagerActions,
  FileManagerItem,
  FileViewMode,
  FileSortField,
  FileSortOrder,
  FileFilterCategory,
} from '../types.js';
import { useWindowStore } from '../../../src/stores/windowStore.js';

const DEFAULT_PATH = '/home/user';
const STORAGE_PREFS_KEY = 'webos_fm_preferences';

function nodeToItem(node: FileMetadata): FileManagerItem {
  return {
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    size: node.size,
    mimeType: node.mimeType,
    createdAt: node.createdAt,
    modifiedAt: node.updatedAt,
    extension: node.type === 'file' ? node.name.split('.').pop() : undefined,
    isTrash: node.path.startsWith('/trash'),
  };
}

// Load saved preferences
function getSavedPreferences() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    viewMode: 'grid' as FileViewMode,
    sortField: 'name' as FileSortField,
    sortOrder: 'asc' as FileSortOrder,
    favorites: ['/home/user', '/home/user/Documents', '/home/user/Downloads', '/home/user/Pictures'],
  };
}

const prefs = getSavedPreferences();

export const useFileManagerStore = create<FileManagerState & FileManagerActions>((set, get) => ({
  currentPath: DEFAULT_PATH,
  history: [DEFAULT_PATH],
  historyIndex: 0,
  items: [],
  selectedPaths: [],
  viewMode: prefs.viewMode || 'grid',
  sortField: prefs.sortField || 'name',
  sortOrder: prefs.sortOrder || 'asc',
  filterCategory: 'all',
  searchQuery: '',
  searchResults: null,
  searchHistory: [],
  favorites: prefs.favorites || ['/home/user', '/home/user/Documents', '/home/user/Downloads'],
  recentItems: [],
  clipboard: null,
  loading: false,
  error: null,
  propertiesItem: null,
  renameItemPath: null,
  createModalType: null,

  navigateTo: async (path: string) => {
    set({ loading: true, error: null, searchQuery: '', searchResults: null });
    try {
      await platform.initialize();
      const fs = platform.fileSystem;
      
      const exists = await fs.exists(path);
      if (!exists) {
        throw new Error(`Directory '${path}' does not exist.`);
      }

      const stat = await fs.stat(path);
      if (stat.type !== 'directory') {
        throw new Error(`Path '${path}' is not a directory.`);
      }

      const nodes = await fs.listDirectory(path);
      const items = nodes.map(nodeToItem);

      const { history, historyIndex } = get();
      let newHistory = history;
      let newIndex = historyIndex;

      if (history[historyIndex] !== path) {
        newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        newIndex = newHistory.length - 1;
      }

      // Add to recent items
      const recentItems = [
        { path, timestamp: Date.now() },
        ...get().recentItems.filter((r) => r.path !== path),
      ].slice(0, 20);

      set({
        currentPath: path,
        history: newHistory,
        historyIndex: newIndex,
        items,
        selectedPaths: [],
        recentItems,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to navigate directory', loading: false });
    }
  },

  navigateBack: async () => {
    const { history, historyIndex, navigateTo } = get();
    if (historyIndex > 0) {
      const prevPath = history[historyIndex - 1];
      if (prevPath) {
        set({ historyIndex: historyIndex - 1 });
        await navigateTo(prevPath);
      }
    }
  },

  navigateForward: async () => {
    const { history, historyIndex, navigateTo } = get();
    if (historyIndex < history.length - 1) {
      const nextPath = history[historyIndex + 1];
      if (nextPath) {
        set({ historyIndex: historyIndex + 1 });
        await navigateTo(nextPath);
      }
    }
  },

  navigateParent: async () => {
    const { currentPath, navigateTo } = get();
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    await navigateTo(parentPath || '/');
  },

  refresh: async () => {
    const { currentPath, navigateTo } = get();
    await navigateTo(currentPath);
  },

  setViewMode: (mode: FileViewMode) => {
    set({ viewMode: mode });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify({ ...getSavedPreferences(), viewMode: mode })
      );
    }
  },

  setSort: (field: FileSortField, order?: FileSortOrder) => {
    const currentField = get().sortField;
    const currentOrder = get().sortOrder;
    const newOrder = order || (currentField === field && currentOrder === 'asc' ? 'desc' : 'asc');

    set({ sortField: field, sortOrder: newOrder });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify({ ...getSavedPreferences(), sortField: field, sortOrder: newOrder })
      );
    }
  },

  setFilter: (category: FileFilterCategory) => {
    set({ filterCategory: category });
  },

  selectItem: (path: string, multiSelect = false, rangeSelect = false) => {
    const { selectedPaths, items } = get();
    if (rangeSelect && selectedPaths.length > 0) {
      const lastSelected = selectedPaths[selectedPaths.length - 1];
      const startIndex = items.findIndex((i) => i.path === lastSelected);
      const endIndex = items.findIndex((i) => i.path === path);
      if (startIndex !== -1 && endIndex !== -1) {
        const range = items
          .slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
          .map((i) => i.path);
        set({ selectedPaths: Array.from(new Set([...selectedPaths, ...range])) });
        return;
      }
    }

    if (multiSelect) {
      if (selectedPaths.includes(path)) {
        set({ selectedPaths: selectedPaths.filter((p) => p !== path) });
      } else {
        set({ selectedPaths: [...selectedPaths, path] });
      }
    } else {
      set({ selectedPaths: [path] });
    }
  },

  selectAll: () => {
    const { items } = get();
    set({ selectedPaths: items.map((i) => i.path) });
  },

  clearSelection: () => {
    set({ selectedPaths: [] });
  },

  createFile: async (name: string, content = '') => {
    const { currentPath, refresh } = get();
    if (!name.trim()) return;
    const filePath = `${currentPath === '/' ? '' : currentPath}/${name.trim()}`;
    set({ loading: true, error: null });
    try {
      await platform.fileSystem.createFile(filePath, { content });
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create file', loading: false });
    }
  },

  createFolder: async (name: string) => {
    const { currentPath, refresh } = get();
    if (!name.trim()) return;
    const folderPath = `${currentPath === '/' ? '' : currentPath}/${name.trim()}`;
    set({ loading: true, error: null });
    try {
      await platform.fileSystem.createDirectory(folderPath);
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create directory', loading: false });
    }
  },

  renameItem: async (oldPath: string, newName: string) => {
    const { refresh } = get();
    if (!newName.trim()) return;
    const cleanName = newName.includes('/') ? newName.split('/').pop() || newName : newName;
    set({ loading: true, error: null });
    try {
      await platform.fileSystem.rename(oldPath, cleanName.trim());
      set({ renameItemPath: null });
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to rename item', loading: false });
    }
  },

  deleteItems: async (paths: string[], permanent = false) => {
    const { refresh, currentPath } = get();
    if (paths.length === 0) return;
    set({ loading: true, error: null });
    try {
      const fs = platform.fileSystem;
      for (const p of paths) {
        if (permanent || currentPath === '/trash' || p.startsWith('/trash')) {
          await fs.delete(p, { recursive: true });
        } else {
          // Move to /trash
          const itemName = p.split('/').pop() || 'item';
          const trashTarget = `/trash/${Date.now()}_${itemName}`;
          await fs.move(p, trashTarget);
        }
      }
      set({ selectedPaths: [] });
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete item(s)', loading: false });
    }
  },

  copyItems: (paths: string[]) => {
    platform.setClipboard(paths, 'copy');
    set({ clipboard: { paths, action: 'copy' } });
  },

  cutItems: (paths: string[]) => {
    platform.setClipboard(paths, 'cut');
    set({ clipboard: { paths, action: 'cut' } });
  },

  pasteItems: async (targetFolder?: string) => {
    const { currentPath, clipboard, refresh } = get();
    const dest = targetFolder || currentPath;
    const clip = clipboard || platform.getClipboard();
    if (!clip || clip.paths.length === 0) return;

    set({ loading: true, error: null });
    try {
      const fs = platform.fileSystem;
      for (const src of clip.paths) {
        const itemName = src.split('/').pop() || 'item';
        let target = `${dest === '/' ? '' : dest}/${itemName}`;
        
        // Handle duplicate names gracefully
        if (await fs.exists(target)) {
          const parts = itemName.split('.');
          if (parts.length > 1 && src.includes('.')) {
            const ext = parts.pop();
            const base = parts.join('.');
            target = `${dest === '/' ? '' : dest}/${base}_copy.${ext}`;
          } else {
            target = `${dest === '/' ? '' : dest}/${itemName}_copy`;
          }
        }

        if (clip.action === 'copy') {
          await fs.copy(src, target);
        } else if (clip.action === 'cut') {
          await fs.move(src, target);
        }
      }

      if (clip.action === 'cut') {
        platform.clearClipboard();
        set({ clipboard: null });
      }
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to paste item(s)', loading: false });
    }
  },

  duplicateItem: async (path: string) => {
    const { copyItems, pasteItems } = get();
    copyItems([path]);
    await pasteItems();
  },

  moveItems: async (paths: string[], targetFolder: string) => {
    const { refresh } = get();
    set({ loading: true, error: null });
    try {
      const fs = platform.fileSystem;
      for (const p of paths) {
        const itemName = p.split('/').pop() || 'item';
        const target = `${targetFolder === '/' ? '' : targetFolder}/${itemName}`;
        await fs.move(p, target);
      }
      await refresh();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to move item(s)', loading: false });
    }
  },

  search: async (query: string) => {
    if (!query || !query.trim()) {
      set({ searchQuery: '', searchResults: null });
      return;
    }
    const cleanQuery = query.trim();
    set({ searchQuery: cleanQuery, loading: true });
    try {
      const fs = platform.fileSystem;
      const results = await fs.search({ query: cleanQuery, pathPrefix: get().currentPath });
      const items = results.map(nodeToItem);

      const history = Array.from(new Set([cleanQuery, ...get().searchHistory])).slice(0, 10);

      set({
        searchResults: items,
        searchHistory: history,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'Search failed', loading: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: null });
  },

  addFavorite: (path: string) => {
    const { favorites } = get();
    if (!favorites.includes(path)) {
      const updated = [...favorites, path];
      set({ favorites: updated });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_PREFS_KEY,
          JSON.stringify({ ...getSavedPreferences(), favorites: updated })
        );
      }
    }
  },

  removeFavorite: (path: string) => {
    const { favorites } = get();
    const updated = favorites.filter((f) => f !== path);
    set({ favorites: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify({ ...getSavedPreferences(), favorites: updated })
      );
    }
  },

  setPropertiesItem: (item) => set({ propertiesItem: item }),
  setRenameItemPath: (path) => set({ renameItemPath: path }),
  setCreateModalType: (type) => set({ createModalType: type }),

  openItem: async (item: FileManagerItem, openWithApp?: (appId: string, path: string) => void) => {
    if (item.type === 'directory') {
      await get().navigateTo(item.path);
      return;
    }

    // Open file in associated application
    const ext = (item.extension || '').toLowerCase();
    const openWin = useWindowStore.getState().openWindow;

    if (['txt', 'js', 'ts', 'json', 'md', 'css', 'html', 'py', 'c', 'cpp'].includes(ext)) {
      openWin({
        id: `text-editor-${Date.now()}`,
        appId: 'text-editor',
        title: `Text Editor - ${item.name}`,
        data: { initialFilePath: item.path },
      });
    } else if (['wdoc', 'doc', 'docx'].includes(ext)) {
      openWin({
        id: `document-editor-${Date.now()}`,
        appId: 'document-editor',
        title: `Document Editor - ${item.name}`,
        data: { initialFilePath: item.path },
      });
    } else {
      // Default to Text Editor
      openWin({
        id: `text-editor-${Date.now()}`,
        appId: 'text-editor',
        title: `Text Editor - ${item.name}`,
        data: { initialFilePath: item.path },
      });
    }
  },
}));
