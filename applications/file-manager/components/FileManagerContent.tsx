/**
 * @file FileManagerContent.tsx
 * @description Main content view rendering files/folders in Grid, List, and Compact modes with drag-and-drop & keyboard shortcuts.
 */

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  File,
  Code,
  Image as ImageIcon,
  Music,
  Video,
  Check,
} from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';
import type { FileManagerItem } from '../types.js';

interface FileManagerContentProps {
  onContextMenu: (e: React.MouseEvent, item: FileManagerItem | null) => void;
}

function getFileIcon(item: FileManagerItem) {
  if (item.type === 'directory') return <Folder size={32} className="fm-icon-folder" />;

  const ext = (item.extension || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) {
    return <ImageIcon size={32} className="fm-icon-image" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <Music size={32} className="fm-icon-audio" />;
  }
  if (['mp4', 'mkv', 'webm', 'mov'].includes(ext)) {
    return <Video size={32} className="fm-icon-video" />;
  }
  if (['ts', 'js', 'json', 'html', 'css', 'py', 'c', 'cpp'].includes(ext)) {
    return <Code size={32} className="fm-icon-code" />;
  }
  if (['txt', 'md', 'doc', 'docx', 'wdoc'].includes(ext)) {
    return <FileText size={32} className="fm-icon-text" />;
  }
  return <File size={32} className="fm-icon-file" />;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const FileManagerContent: React.FC<FileManagerContentProps> = ({ onContextMenu }) => {
  const {
    items,
    selectedPaths,
    viewMode,
    sortField,
    sortOrder,
    filterCategory,
    searchQuery,
    searchResults,
    renameItemPath,
    selectItem,
    selectAll,
    clearSelection,
    openItem,
    renameItem,
    deleteItems,
    copyItems,
    cutItems,
    pasteItems,
    moveItems,
  } = useFileManagerStore();

  const [inlineRenameName, setInlineRenameName] = useState('');
  const [draggedPaths, setDraggedPaths] = useState<string[]>([]);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

  const displayItems = searchResults !== null ? searchResults : items;

  // Filter items
  const filteredItems = displayItems.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'folders') return item.type === 'directory';
    if (filterCategory === 'files') return item.type === 'file';
    const ext = (item.extension || '').toLowerCase();
    if (filterCategory === 'documents') return ['txt', 'md', 'doc', 'docx', 'wdoc', 'pdf'].includes(ext);
    if (filterCategory === 'code') return ['ts', 'js', 'json', 'html', 'css', 'py'].includes(ext);
    if (filterCategory === 'images') return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Folders always first
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;

    let comp = 0;
    if (sortField === 'name') comp = a.name.localeCompare(b.name);
    else if (sortField === 'size') comp = a.size - b.size;
    else if (sortField === 'modifiedAt') comp = a.modifiedAt - b.modifiedAt;
    else if (sortField === 'createdAt') comp = a.createdAt - b.createdAt;
    else if (sortField === 'type') comp = (a.extension || '').localeCompare(b.extension || '');

    return sortOrder === 'asc' ? comp : -comp;
  });

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          selectAll();
        } else if (e.key === 'c' || e.key === 'C') {
          if (selectedPaths.length > 0) {
            e.preventDefault();
            copyItems(selectedPaths);
          }
        } else if (e.key === 'x' || e.key === 'X') {
          if (selectedPaths.length > 0) {
            e.preventDefault();
            cutItems(selectedPaths);
          }
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          pasteItems();
        }
      } else if (e.key === 'Delete') {
        if (selectedPaths.length > 0) {
          e.preventDefault();
          deleteItems(selectedPaths);
        }
      } else if (e.key === 'F2') {
        if (selectedPaths.length === 1) {
          e.preventDefault();
          const target = sortedItems.find((i) => i.path === selectedPaths[0]);
          if (target) {
            useFileManagerStore.getState().setRenameItemPath(target.path);
            setInlineRenameName(target.name);
          }
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPaths, sortedItems, selectAll, clearSelection, copyItems, cutItems, pasteItems, deleteItems]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: FileManagerItem) => {
    const pathsToDrag = selectedPaths.includes(item.path) ? selectedPaths : [item.path];
    setDraggedPaths(pathsToDrag);
    e.dataTransfer.setData('application/json', JSON.stringify({ paths: pathsToDrag }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderItem: FileManagerItem) => {
    if (folderItem.type === 'directory' && !draggedPaths.includes(folderItem.path)) {
      e.preventDefault();
      setDropTargetFolder(folderItem.path);
    }
  };

  const handleDrop = async (e: React.DragEvent, folderItem: FileManagerItem) => {
    e.preventDefault();
    setDropTargetFolder(null);
    if (folderItem.type === 'directory' && draggedPaths.length > 0) {
      await moveItems(draggedPaths, folderItem.path);
      setDraggedPaths([]);
    }
  };

  const handleRenameSubmit = async (oldPath: string) => {
    if (inlineRenameName.trim()) {
      await renameItem(oldPath, inlineRenameName.trim());
    }
    useFileManagerStore.getState().setRenameItemPath(null);
  };

  return (
    <div
      className="fm-content-container"
      onClick={() => clearSelection()}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, null);
      }}
    >
      {sortedItems.length === 0 ? (
        <div className="fm-empty-state">
          <Folder size={48} className="fm-empty-icon" />
          <div className="fm-empty-title">
            {searchQuery ? `No items found matching "${searchQuery}"` : 'This folder is empty'}
          </div>
          <div className="fm-empty-subtitle">
            {searchQuery ? 'Try adjusting your search query or filter' : 'Create new files or folders to populate this directory'}
          </div>
        </div>
      ) : (
        <div className={`fm-view-${viewMode}`}>
          {sortedItems.map((item) => {
            const isSelected = selectedPaths.includes(item.path);
            const isRenaming = renameItemPath === item.path;
            const isDropTarget = dropTargetFolder === item.path;

            return (
              <div
                key={item.path}
                className={`fm-item ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={() => setDropTargetFolder(null)}
                onDrop={(e) => handleDrop(e, item)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectItem(item.path, e.ctrlKey || e.metaKey, e.shiftKey);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  openItem(item);
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!selectedPaths.includes(item.path)) {
                    selectItem(item.path);
                  }
                  onContextMenu(e, item);
                }}
              >
                <div className="fm-item-icon-wrap">
                  {getFileIcon(item)}
                  {isSelected && (
                    <div className="fm-item-check">
                      <Check size={12} />
                    </div>
                  )}
                </div>

                <div className="fm-item-details">
                  {isRenaming ? (
                    <input
                      type="text"
                      className="fm-item-rename-input"
                      value={inlineRenameName}
                      onChange={(e) => setInlineRenameName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(item.path);
                        if (e.key === 'Escape') useFileManagerStore.getState().setRenameItemPath(null);
                      }}
                      onBlur={() => handleRenameSubmit(item.path)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="fm-item-name" title={item.name}>
                      {item.name}
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <>
                      <div className="fm-item-size">{item.type === 'directory' ? 'Folder' : formatBytes(item.size)}</div>
                      <div className="fm-item-date">{new Date(item.modifiedAt).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
