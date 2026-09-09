/**
 * @file NotesList.tsx
 * @description Notes list panel with live search input, filter indicators, and note item cards.
 */

import React from 'react';
import { Search, Pin, Star, Trash2, X } from 'lucide-react';
import { useNotesStore } from '../store/notesStore.js';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const NotesList: React.FC = () => {
  const {
    notes,
    activeNoteId,
    activeFolderId,
    activeTagId,
    filterCategory,
    searchQuery,
    tags,
    setActiveNote,
    setSearchQuery,
    togglePinNote,
    toggleFavoriteNote,
    deleteNote,
  } = useNotesStore();

  const filteredNotes = notes.filter((note) => {
    // Category filter
    if (filterCategory === 'archived' && !note.isArchived) return false;
    if (filterCategory !== 'archived' && note.isArchived) return false;
    if (filterCategory === 'pinned' && !note.isPinned) return false;
    if (filterCategory === 'favorites' && !note.isFavorite) return false;

    // Folder filter
    if (activeFolderId && note.folderId !== activeFolderId) return false;

    // Tag filter
    if (activeTagId) {
      const tagObj = tags.find((t) => t.id === activeTagId);
      if (tagObj && !note.tags.includes(tagObj.name)) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTags = note.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }

    return true;
  });

  // Sort: Pinned notes first, then latest modified
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="notes-list-panel">
      {/* Search Header */}
      <div className="notes-list-header">
        <div className="notes-search-wrap">
          <Search size={14} className="notes-search-icon" />
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="notes-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Notes List Cards */}
      <div className="notes-list-scroll">
        {sortedNotes.length === 0 ? (
          <div className="notes-list-empty">
            {searchQuery ? `No notes matching "${searchQuery}"` : 'No notes in this view'}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const snippet = note.content.replace(/[#*`~]/g, '').trim().substring(0, 80);

            return (
              <div
                key={note.id}
                className={`notes-card ${isActive ? 'active' : ''} ${note.isPinned ? 'pinned' : ''}`}
                onClick={() => setActiveNote(note.id)}
              >
                <div className="notes-card-header">
                  <div className="notes-card-title">{note.title || 'Untitled Note'}</div>
                  <div className="notes-card-actions">
                    <button
                      className={`notes-card-btn ${note.isPinned ? 'active' : ''}`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinNote(note.id);
                      }}
                    >
                      <Pin size={13} />
                    </button>
                    <button
                      className={`notes-card-btn ${note.isFavorite ? 'active' : ''}`}
                      title={note.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteNote(note.id);
                      }}
                    >
                      <Star size={13} />
                    </button>
                  </div>
                </div>

                <div className="notes-card-snippet">{snippet || 'Empty note...'}</div>

                <div className="notes-card-footer">
                  <span className="notes-card-date">{formatDate(note.updatedAt)}</span>
                  {note.tags.length > 0 && (
                    <div className="notes-card-tags">
                      {note.tags.map((tag) => (
                        <span key={tag} className="notes-tag-badge">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
