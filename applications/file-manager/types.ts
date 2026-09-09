/**
 * @file types.ts
 * @description Types and data contracts for WebOS File Manager.
 */

import type { FileMetadata } from '../../core/filesystem/types.js';

export type FileViewMode = 'grid' | 'list' | 'compact';
export type FileSortField = 'name' | 'type' | 'size' | 'modifiedAt' | 'createdAt';
export type FileSortOrder = 'asc' | 'desc';
export type FileFilterCategory = 'all' | 'files' | 'folders' | 'documents' | 'images' | 'audio' | 'code';

export interface FileManagerItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  mimeType?: string;
  createdAt: number;
  modifiedAt: number;
  extension?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
}

export interface FileManagerState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  items: FileManagerItem[];
  selectedPaths: string[];
  viewMode: FileViewMode;
  sortField: FileSortField;
  sortOrder: FileSortOrder;
  filterCategory: FileFilterCategory;
  searchQuery: string;
  searchResults: FileManagerItem[] | null;
  searchHistory: string[];
  favorites: string[];
  recentItems: Array<{ path: string; timestamp: number }>;
  clipboard: { paths: string[]; action: 'copy' | 'cut' } | null;
  loading: boolean;
  error: string | null;
  propertiesItem: FileManagerItem | null;
  renameItemPath: string | null;
  createModalType: 'file' | 'folder' | null;
}

export interface FileManagerActions {
  navigateTo: (path: string) => Promise<void>;
  navigateBack: () => Promise<void>;
  navigateForward: () => Promise<void>;
  navigateParent: () => Promise<void>;
  refresh: () => Promise<void>;
  
  setViewMode: (mode: FileViewMode) => void;
  setSort: (field: FileSortField, order?: FileSortOrder) => void;
  setFilter: (category: FileFilterCategory) => void;
  
  selectItem: (path: string, multiSelect?: boolean, rangeSelect?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  createFile: (name: string, content?: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  deleteItems: (paths: string[], permanent?: boolean) => Promise<void>;
  
  copyItems: (paths: string[]) => void;
  cutItems: (paths: string[]) => void;
  pasteItems: (targetFolder?: string) => Promise<void>;
  duplicateItem: (path: string) => Promise<void>;
  moveItems: (paths: string[], targetFolder: string) => Promise<void>;

  search: (query: string) => Promise<void>;
  clearSearch: () => void;

  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
  
  setPropertiesItem: (item: FileManagerItem | null) => void;
  setRenameItemPath: (path: string | null) => void;
  setCreateModalType: (type: 'file' | 'folder' | null) => void;
  
  openItem: (item: FileManagerItem, openWithApp?: (appId: string, path: string) => void) => Promise<void>;
}
