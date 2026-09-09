/**
 * @file FileManagerApp.tsx
 * @description Main application container for WebOS File Manager.
 */

import React, { useEffect, useState } from 'react';
import { useFileManagerStore } from './store/fileManagerStore.js';
import { FileManagerToolbar } from './components/FileManagerToolbar.js';
import { FileManagerSidebar } from './components/FileManagerSidebar.js';
import { FileManagerBreadcrumb } from './components/FileManagerBreadcrumb.js';
import { FileManagerContent } from './components/FileManagerContent.js';
import { FileManagerContextMenu } from './components/FileManagerContextMenu.js';
import { FileManagerPropertiesModal } from './components/FileManagerPropertiesModal.js';
import type { FileManagerItem } from './types.js';
import './fileManager.css';

export interface FileManagerAppProps {
  windowId?: string;
  appId?: string;
}

export const FileManagerApp: React.FC<FileManagerAppProps> = () => {
  const {
    currentPath,
    items,
    selectedPaths,
    searchResults,
    loading,
    error,
    createModalType,
    navigateTo,
    createFile,
    createFolder,
    setCreateModalType,
  } = useFileManagerStore();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextTargetItem, setContextTargetItem] = useState<FileManagerItem | null>(null);
  const [modalInputName, setModalInputName] = useState('');

  useEffect(() => {
    navigateTo(currentPath);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, item: FileManagerItem | null) => {
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextTargetItem(item);
  };

  const handleCreateSubmit = async () => {
    if (!modalInputName.trim()) return;
    if (createModalType === 'folder') {
      await createFolder(modalInputName.trim());
    } else if (createModalType === 'file') {
      await createFile(modalInputName.trim());
    }
    setModalInputName('');
    setCreateModalType(null);
  };

  const displayCount = searchResults !== null ? searchResults.length : items.length;

  return (
    <div className="fm-app">
      {/* Top Action Toolbar */}
      <FileManagerToolbar />

      {/* Breadcrumb Path Bar */}
      <FileManagerBreadcrumb />

      {/* Main Body */}
      <div className="fm-body">
        <FileManagerSidebar />
        <FileManagerContent onContextMenu={handleContextMenu} />
      </div>

      {/* Status Bar */}
      <div className="fm-status-bar">
        <div className="fm-status-left">
          <span>{displayCount} item(s)</span>
          {selectedPaths.length > 0 && (
            <span style={{ marginLeft: 12, color: '#38bdf8' }}>
              {selectedPaths.length} selected
            </span>
          )}
        </div>
        <div className="fm-status-right">
          {loading && <span>Loading...</span>}
          {error && <span style={{ color: '#ef4444' }}>{error}</span>}
          {!loading && !error && <span>{currentPath}</span>}
        </div>
      </div>

      {/* Application Context Menu */}
      {contextMenuPos && (
        <FileManagerContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          targetItem={contextTargetItem}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* File / Folder Creation Modal */}
      {createModalType && (
        <div className="fm-modal-overlay" onClick={() => setCreateModalType(null)}>
          <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-modal-header">
              <div className="fm-modal-title">
                Create New {createModalType === 'folder' ? 'Folder' : 'File'}
              </div>
            </div>
            <div className="fm-modal-body">
              <input
                type="text"
                className="fm-breadcrumb-input"
                placeholder={createModalType === 'folder' ? 'Folder name...' : 'File name (e.g. notes.txt)...'}
                value={modalInputName}
                onChange={(e) => setModalInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubmit();
                  if (e.key === 'Escape') setCreateModalType(null);
                }}
                autoFocus
              />
            </div>
            <div className="fm-modal-footer">
              <button className="fm-btn" onClick={() => setCreateModalType(null)}>
                Cancel
              </button>
              <button className="fm-btn fm-btn-accent" onClick={handleCreateSubmit}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Modal */}
      <FileManagerPropertiesModal />
    </div>
  );
};

export default FileManagerApp;
