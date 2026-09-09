/**
 * @file FileManagerContextMenu.tsx
 * @description Application right-click context menu for items and canvas background.
 */

import React, { useEffect, useRef } from 'react';
import {
  FolderOpen,
  Copy,
  Scissors,
  Clipboard as PasteIcon,
  Trash2,
  Edit,
  Star,
  Info,
  FolderPlus,
  FilePlus,
  RefreshCw,
} from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';
import type { FileManagerItem } from '../types.js';

interface ContextMenuProps {
  x: number;
  y: number;
  targetItem: FileManagerItem | null;
  onClose: () => void;
}

export const FileManagerContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetItem,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selectedPaths,
    clipboard,
    openItem,
    copyItems,
    cutItems,
    pasteItems,
    duplicateItem,
    deleteItems,
    addFavorite,
    setRenameItemPath,
    setPropertiesItem,
    setCreateModalType,
    refresh,
  } = useFileManagerStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const itemsToAct = targetItem ? (selectedPaths.includes(targetItem.path) ? selectedPaths : [targetItem.path]) : [];

  return (
    <div
      ref={menuRef}
      className="fm-context-menu"
      style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 280) }}
    >
      {targetItem ? (
        <>
          <button
            className="fm-context-item"
            onClick={() => {
              openItem(targetItem);
              onClose();
            }}
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </button>

          <div className="fm-context-divider" />

          <button
            className="fm-context-item"
            onClick={() => {
              copyItems(itemsToAct);
              onClose();
            }}
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>

          <button
            className="fm-context-item"
            onClick={() => {
              cutItems(itemsToAct);
              onClose();
            }}
          >
            <Scissors size={14} />
            <span>Cut</span>
          </button>

          <button
            className="fm-context-item"
            onClick={() => {
              duplicateItem(targetItem.path);
              onClose();
            }}
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>

          <button
            className="fm-context-item"
            onClick={() => {
              setRenameItemPath(targetItem.path);
              onClose();
            }}
          >
            <Edit size={14} />
            <span>Rename</span>
          </button>

          <div className="fm-context-divider" />

          <button
            className="fm-context-item"
            onClick={() => {
              addFavorite(targetItem.path);
              onClose();
            }}
          >
            <Star size={14} />
            <span>Add to Favorites</span>
          </button>

          <button
            className="fm-context-item danger"
            onClick={() => {
              deleteItems(itemsToAct);
              onClose();
            }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="fm-context-divider" />

          <button
            className="fm-context-item"
            onClick={() => {
              setPropertiesItem(targetItem);
              onClose();
            }}
          >
            <Info size={14} />
            <span>Properties</span>
          </button>
        </>
      ) : (
        <>
          <button
            className="fm-context-item"
            onClick={() => {
              setCreateModalType('folder');
              onClose();
            }}
          >
            <FolderPlus size={14} />
            <span>New Folder</span>
          </button>

          <button
            className="fm-context-item"
            onClick={() => {
              setCreateModalType('file');
              onClose();
            }}
          >
            <FilePlus size={14} />
            <span>New File</span>
          </button>

          <div className="fm-context-divider" />

          <button
            className="fm-context-item"
            disabled={!clipboard}
            onClick={() => {
              pasteItems();
              onClose();
            }}
          >
            <PasteIcon size={14} />
            <span>Paste</span>
          </button>

          <button
            className="fm-context-item"
            onClick={() => {
              refresh();
              onClose();
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </>
      )}
    </div>
  );
};
