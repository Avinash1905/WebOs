import React, { useState } from 'react';
import { Plus, Trash2, Tag, Search, BookOpen, Clock } from 'lucide-react';
import './notes.css';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: number;
}

export const NotesApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'note-1',
      title: 'WebOS Architecture & Systems',
      content: '# WebOS Roadmap\n\n- [x] Window Manager & Compositor\n- [x] POSIX Virtual File System\n- [x] Process Scheduler & Signal Dispatcher\n- [x] Core Shell Interpreter\n- [x] Built-in Application Suite\n',
      category: 'Work',
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'note-2',
      title: 'Meeting Notes: Core Integration',
      content: 'Discussed process scheduler quantum timeslices (20ms), VFS persistent IndexedDB adapter, and backend user token sync.',
      category: 'Personal',
      updatedAt: Date.now() - 86400000,
    },
  ]);

  const [selectedNoteId, setSelectedNoteId] = useState<string>('note-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleUpdateContent = (field: 'title' | 'content' | 'category', val: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, [field]: val, updatedAt: Date.now() } : n
      )
    );
  };

  const handleNewNote = () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: selectedCategory === 'All' ? 'General' : selectedCategory,
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedNoteId === id && remaining.length > 0) {
      setSelectedNoteId(remaining[0].id);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchQ =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="notes-app-container">
      {/* Sidebar Note Categories & List */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div className="notes-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="new-note-btn" onClick={handleNewNote} title="Create New Note">
            <Plus size={16} />
          </button>
        </div>

        <div className="notes-categories-bar" style={{ display: 'flex', gap: '6px', padding: '6px 12px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', overflowX: 'auto' }}>
          {['All', 'Work', 'Personal', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                border: 'none',
                background: selectedCategory === cat ? 'var(--accent-primary, #38bdf8)' : 'rgba(255,255,255,0.06)',
                color: selectedCategory === cat ? '#000' : 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Tag size={10} />
              {cat}
            </button>
          ))}
        </div>

        <div className="notes-list">
          {filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const dateStr = new Date(note.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={note.id}
                className={`note-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="note-card-title">{note.title || 'Untitled'}</div>
                <div className="note-card-snippet">
                  {note.content.substring(0, 60) || 'No additional text...'}
                </div>
                <div className="note-card-footer">
                  <span className="note-card-date"><Clock size={11} /> {dateStr}</span>
                  <span className="note-card-badge">{note.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Note Editor Canvas */}
      <div className="notes-editor-main">
        {selectedNote ? (
          <>
            <div className="notes-editor-header">
              <input
                type="text"
                className="note-title-input"
                value={selectedNote.title}
                onChange={(e) => handleUpdateContent('title', e.target.value)}
                placeholder="Note Title..."
              />
              <div className="note-editor-actions">
                <input
                  type="text"
                  className="note-category-input"
                  value={selectedNote.category}
                  onChange={(e) => handleUpdateContent('category', e.target.value)}
                  placeholder="Category..."
                />
                <button
                  className="note-delete-btn"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  title="Delete Note"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <textarea
              className="note-body-textarea"
              value={selectedNote.content}
              onChange={(e) => handleUpdateContent('content', e.target.value)}
              placeholder="Write your markdown note here..."
            />
          </>
        ) : (
          <div className="no-note-selected">
            <BookOpen size={48} className="empty-icon" />
            <p>No note selected. Click "+ New Note" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
