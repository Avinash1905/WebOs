/**
 * @file NotesSidebar.tsx
 * @description Sidebar navigation for Notes folders, categories (All, Pinned, Favorites, Archive), and Tags.
 */

import React, { useState } from 'react';
import {
  FileText,
  Folder,
  Star,
  Pin,
  Archive,
  Tag as TagIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useNotesStore } from '../store/notesStore.js';
import type { NoteFilterCategory } from '../types.js';

export const NotesSidebar: React.FC = () => {
  const {
    folders,
    tags,
    activeFolderId,
    activeTagId,
    filterCategory,
    createNote,
    createFolder,
    deleteFolder,
    createTag,
    deleteTag,
    setActiveFolder,
    setActiveTag,
    setFilterCategory,
  } = useNotesStore();

  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim());
      setNewTagName('');
      setShowNewTagInput(false);
    }
  };

  return (
    <aside className="notes-sidebar">
      {/* New Note Button */}
      <div className="notes-sidebar-action">
        <button className="notes-btn-new" onClick={() => createNote()}>
          <Plus size={16} />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Categories Navigation */}
      <div className="notes-sidebar-section">
        <nav className="notes-nav">
          <button
            className={`notes-nav-item ${filterCategory === 'all' && !activeFolderId && !activeTagId ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            <FileText size={16} />
            <span>All Notes</span>
          </button>
          <button
            className={`notes-nav-item ${filterCategory === 'pinned' ? 'active' : ''}`}
            onClick={() => setFilterCategory('pinned')}
          >
            <Pin size={16} />
            <span>Pinned</span>
          </button>
          <button
            className={`notes-nav-item ${filterCategory === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilterCategory('favorites')}
          >
            <Star size={16} />
            <span>Favorites</span>
          </button>
          <button
            className={`notes-nav-item ${filterCategory === 'archived' ? 'active' : ''}`}
            onClick={() => setFilterCategory('archived')}
          >
            <Archive size={16} />
            <span>Archived</span>
          </button>
        </nav>
      </div>

      {/* Folders Section */}
      <div className="notes-sidebar-section">
        <div className="notes-section-header">
          <span>Folders</span>
          <button className="notes-btn-header-add" onClick={() => setShowNewFolderInput(!showNewFolderInput)}>
            <Plus size={14} />
          </button>
        </div>

        {showNewFolderInput && (
          <div className="notes-inline-input-row">
            <input
              type="text"
              className="notes-inline-input"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              autoFocus
            />
          </div>
        )}

        <nav className="notes-nav">
          {folders.map((folder) => {
            const isActive = activeFolderId === folder.id;
            return (
              <div key={folder.id} className={`notes-nav-item-wrap ${isActive ? 'active' : ''}`}>
                <button className="notes-nav-item" onClick={() => setActiveFolder(folder.id)}>
                  <Folder size={16} style={{ color: folder.color || '#38bdf8' }} />
                  <span className="notes-nav-label">{folder.name}</span>
                </button>
                <button className="notes-nav-delete-btn" onClick={() => deleteFolder(folder.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Tags Section */}
      <div className="notes-sidebar-section">
        <div className="notes-section-header">
          <span>Tags</span>
          <button className="notes-btn-header-add" onClick={() => setShowNewTagInput(!showNewTagInput)}>
            <Plus size={14} />
          </button>
        </div>

        {showNewTagInput && (
          <div className="notes-inline-input-row">
            <input
              type="text"
              className="notes-inline-input"
              placeholder="Tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              autoFocus
            />
          </div>
        )}

        <nav className="notes-nav">
          {tags.map((tag) => {
            const isActive = activeTagId === tag.id;
            return (
              <div key={tag.id} className={`notes-nav-item-wrap ${isActive ? 'active' : ''}`}>
                <button className="notes-nav-item" onClick={() => setActiveTag(tag.id)}>
                  <TagIcon size={14} style={{ color: tag.color }} />
                  <span className="notes-nav-label">{tag.name}</span>
                </button>
                <button className="notes-nav-delete-btn" onClick={() => deleteTag(tag.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
