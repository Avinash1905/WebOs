/**
 * @file NotesEditor.tsx
 * @description Rich Note editor with title, formatting toolbar, tag chips, and revision history integration.
 */

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  History,
  Tag as TagIcon,
  Trash2,
  Archive,
  Save,
  Plus,
  X,
} from 'lucide-react';
import { useNotesStore } from '../store/notesStore.js';

export const NotesEditor: React.FC = () => {
  const {
    notes,
    tags: availableTags,
    activeNoteId,
    isSaving,
    updateActiveNote,
    addTagToActiveNote,
    removeTagFromActiveNote,
    deleteNote,
    toggleArchiveNote,
    setViewingRevision,
  } = useNotesStore();

  const [newTagInput, setNewTagInput] = useState('');
  const [showTagMenu, setShowTagMenu] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  if (!activeNote) {
    return (
      <div className="notes-editor-empty">
        <div className="notes-editor-empty-text">No Note Selected</div>
        <div className="notes-editor-empty-sub">Select a note from the list or click "New Note" to start writing</div>
      </div>
    );
  }

  const handleInsertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('notes-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = activeNote.content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent =
      activeNote.content.substring(0, start) + replacement + activeNote.content.substring(end);

    updateActiveNote({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + (selectedText ? selectedText.length : 4);
    }, 0);
  };

  const handleAddCustomTag = () => {
    if (newTagInput.trim()) {
      addTagToActiveNote(newTagInput.trim());
      setNewTagInput('');
      setShowTagMenu(false);
    }
  };

  return (
    <div className="notes-editor-container">
      {/* Editor Header / Formatting Toolbar */}
      <div className="notes-editor-toolbar">
        <div className="notes-toolbar-group">
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('**', '**')} title="Bold">
            <Bold size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('*', '*')} title="Italic">
            <Italic size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('<u>', '</u>')} title="Underline">
            <Underline size={15} />
          </button>
        </div>

        <div className="notes-toolbar-divider" />

        <div className="notes-toolbar-group">
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('# ')} title="Heading 1">
            <Heading1 size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('## ')} title="Heading 2">
            <Heading2 size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('- ')} title="Bullet List">
            <List size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('1. ')} title="Numbered List">
            <ListOrdered size={15} />
          </button>
          <button className="notes-tb-btn" onClick={() => handleInsertFormatting('- [ ] ')} title="Checklist Item">
            <CheckSquare size={15} />
          </button>
        </div>

        <div className="notes-toolbar-spacer" />

        <div className="notes-toolbar-group">
          {/* History Button */}
          <button
            className="notes-tb-btn"
            title="Revision History"
            disabled={activeNote.revisions.length === 0}
            onClick={() => {
              if (activeNote.revisions.length > 0) {
                setViewingRevision(activeNote.revisions[activeNote.revisions.length - 1]!);
              }
            }}
          >
            <History size={15} />
            <span>History ({activeNote.revisions.length})</span>
          </button>

          <button
            className="notes-tb-btn"
            title={activeNote.isArchived ? 'Restore' : 'Archive Note'}
            onClick={() => toggleArchiveNote(activeNote.id)}
          >
            <Archive size={15} />
          </button>

          <button
            className="notes-tb-btn danger"
            title="Delete Note"
            onClick={() => deleteNote(activeNote.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Note Title Input & Tags */}
      <div className="notes-editor-header">
        <input
          type="text"
          className="notes-title-input"
          placeholder="Note Title..."
          value={activeNote.title}
          onChange={(e) => updateActiveNote({ title: e.target.value })}
        />

        {/* Tags Bar */}
        <div className="notes-tags-bar">
          <TagIcon size={14} className="notes-tag-icon" />
          {activeNote.tags.map((tag) => (
            <span key={tag} className="notes-tag-chip">
              {tag}
              <button className="notes-tag-remove" onClick={() => removeTagFromActiveNote(tag)}>
                <X size={10} />
              </button>
            </span>
          ))}

          {/* Add Tag Dropdown */}
          <div className="notes-add-tag-wrap">
            <button className="notes-add-tag-btn" onClick={() => setShowTagMenu(!showTagMenu)}>
              <Plus size={12} /> Add Tag
            </button>

            {showTagMenu && (
              <div className="notes-tag-menu">
                {availableTags.map((t) => (
                  <button
                    key={t.id}
                    className="notes-tag-menu-item"
                    onClick={() => {
                      addTagToActiveNote(t.name);
                      setShowTagMenu(false);
                    }}
                  >
                    <span className="notes-tag-dot" style={{ background: t.color }} />
                    {t.name}
                  </button>
                ))}

                <div className="notes-tag-menu-input-row">
                  <input
                    type="text"
                    className="notes-tag-menu-input"
                    placeholder="New tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="notes-editor-body">
        <textarea
          id="notes-content-textarea"
          className="notes-content-textarea"
          placeholder="Start typing your note here..."
          value={activeNote.content}
          onChange={(e) => updateActiveNote({ content: e.target.value })}
        />
      </div>

      {/* Editor Footer Status */}
      <div className="notes-editor-footer">
        <span className="notes-save-status">
          {isSaving ? 'Saving...' : 'All changes saved to WebOS'}
        </span>
        <span className="notes-char-count">{activeNote.content.length} chars</span>
      </div>
    </div>
  );
};
