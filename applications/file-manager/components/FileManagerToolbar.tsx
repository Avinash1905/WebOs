/**
 * @file FileManagerToolbar.tsx
 * @description Header toolbar for navigation, action controls, search input, and view options.
 */

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Grid,
  List,
  Search,
  X,
  Trash2,
  Copy,
  Scissors,
  Clipboard as PasteIcon,
} from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';
import type { FileViewMode, FileSortField, FileSortOrder, FileFilterCategory } from '../types.js';

export const FileManagerToolbar: React.FC = () => {
  const {
    historyIndex,
    history,
    currentPath,
    selectedPaths,
    viewMode,
    sortField,
    sortOrder,
    filterCategory,
    searchQuery,
    clipboard,
    navigateBack,
    navigateForward,
    navigateParent,
    refresh,
    setViewMode,
    setSort,
    setFilter,
    search,
    clearSearch,
    setCreateModalType,
    deleteItems,
    copyItems,
    cutItems,
    pasteItems,
  } = useFileManagerStore();

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoParent = currentPath !== '/';
  const hasSelection = selectedPaths.length > 0;

  return (
    <div className="fm-toolbar">
      {/* Navigation Controls */}
      <div className="fm-toolbar-group">
        <button
          className="fm-btn fm-btn-icon"
          disabled={!canGoBack}
          onClick={navigateBack}
          title="Back (Alt + Left)"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="fm-btn fm-btn-icon"
          disabled={!canGoForward}
          onClick={navigateForward}
          title="Forward (Alt + Right)"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="fm-btn fm-btn-icon"
          disabled={!canGoParent}
          onClick={navigateParent}
          title="Up to Parent Directory"
        >
          <ArrowUp size={16} />
        </button>
        <button className="fm-btn fm-btn-icon" onClick={refresh} title="Refresh (F5)">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="fm-toolbar-divider" />

      {/* Creation Actions */}
      <div className="fm-toolbar-group">
        <button
          className="fm-btn"
          onClick={() => setCreateModalType('folder')}
          title="Create New Folder"
        >
          <FolderPlus size={16} />
          <span>New Folder</span>
        </button>
        <button
          className="fm-btn"
          onClick={() => setCreateModalType('file')}
          title="Create New File"
        >
          <FilePlus size={16} />
          <span>New File</span>
        </button>
      </div>

      {/* Clipboard / Selection Actions */}
      {hasSelection && (
        <>
          <div className="fm-toolbar-divider" />
          <div className="fm-toolbar-group">
            <button className="fm-btn fm-btn-icon" onClick={() => copyItems(selectedPaths)} title="Copy (Ctrl+C)">
              <Copy size={16} />
            </button>
            <button className="fm-btn fm-btn-icon" onClick={() => cutItems(selectedPaths)} title="Cut (Ctrl+X)">
              <Scissors size={16} />
            </button>
            <button className="fm-btn fm-btn-icon" onClick={() => deleteItems(selectedPaths)} title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}

      {clipboard && (
        <div className="fm-toolbar-group">
          <button className="fm-btn fm-btn-accent" onClick={() => pasteItems()} title="Paste (Ctrl+V)">
            <PasteIcon size={16} />
            <span>Paste ({clipboard.paths.length})</span>
          </button>
        </div>
      )}

      <div className="fm-toolbar-spacer" />

      {/* Search Bar */}
      <div className="fm-search-bar">
        <Search size={14} className="fm-search-icon" />
        <input
          type="text"
          className="fm-search-input"
          placeholder="Search files & folders..."
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
        />
        {searchQuery && (
          <button className="fm-btn-clear-search" onClick={clearSearch}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="fm-toolbar-divider" />

      {/* Sort & Filter Options */}
      <div className="fm-toolbar-group">
        <select
          className="fm-select"
          value={filterCategory}
          onChange={(e) => setFilter(e.target.value as FileFilterCategory)}
          title="Filter Files"
        >
          <option value="all">All Items</option>
          <option value="folders">Folders Only</option>
          <option value="files">Files Only</option>
          <option value="documents">Documents</option>
          <option value="code">Code & Text</option>
          <option value="images">Images</option>
        </select>

        <select
          className="fm-select"
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [f, o] = e.target.value.split('-') as [FileSortField, FileSortOrder];
            setSort(f, o);
          }}
          title="Sort By"
        >
          <option value="name-asc">Name (A to Z)</option>
          <option value="name-desc">Name (Z to A)</option>
          <option value="size-asc">Size (Smallest)</option>
          <option value="size-desc">Size (Largest)</option>
          <option value="modifiedAt-desc">Modified (Newest)</option>
          <option value="modifiedAt-asc">Modified (Oldest)</option>
        </select>
      </div>

      {/* View Mode Switcher */}
      <div className="fm-toolbar-group fm-view-switcher">
        <button
          className={`fm-btn fm-btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid View"
        >
          <Grid size={16} />
        </button>
        <button
          className={`fm-btn fm-btn-icon ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
          title="List View"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
};
