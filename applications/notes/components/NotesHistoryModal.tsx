/**
 * @file NotesHistoryModal.tsx
 * @description Revision history timeline modal allowing users to preview and restore past note revisions.
 */

import React from 'react';
import { X, History, RotateCcw, Clock } from 'lucide-react';
import { useNotesStore } from '../store/notesStore.js';
import type { NoteRevision } from '../types.js';

export const NotesHistoryModal: React.FC = () => {
  const { notes, activeNoteId, viewingRevision, setViewingRevision, restoreRevision } = useNotesStore();

  const activeNote = notes.find((n) => n.id === activeNoteId);

  if (!viewingRevision || !activeNote) return null;

  return (
    <div className="notes-modal-overlay" onClick={() => setViewingRevision(null)}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-modal-header">
          <div className="notes-modal-title">
            <History size={18} />
            <span>Revision History — {activeNote.title}</span>
          </div>
          <button className="notes-modal-close" onClick={() => setViewingRevision(null)}>
            <X size={16} />
          </button>
        </div>

        <div className="notes-modal-body">
          {/* Revisions Timeline List */}
          <div className="notes-rev-timeline">
            {activeNote.revisions.map((rev, idx) => {
              const isSelected = rev.id === viewingRevision.id;
              return (
                <button
                  key={rev.id}
                  className={`notes-rev-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setViewingRevision(rev)}
                >
                  <Clock size={14} />
                  <span>Revision #{idx + 1}</span>
                  <span className="notes-rev-time">
                    {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Revision Preview Pane */}
          <div className="notes-rev-preview">
            <div className="notes-rev-preview-header">
              <span className="notes-rev-preview-title">{viewingRevision.title}</span>
              <span className="notes-rev-preview-date">
                Saved {new Date(viewingRevision.timestamp).toLocaleString()}
              </span>
            </div>
            <pre className="notes-rev-preview-content">{viewingRevision.content}</pre>
          </div>
        </div>

        <div className="notes-modal-footer">
          <button className="notes-btn" onClick={() => setViewingRevision(null)}>
            Cancel
          </button>
          <button
            className="notes-btn notes-btn-accent"
            onClick={() => restoreRevision(viewingRevision)}
          >
            <RotateCcw size={14} />
            <span>Restore This Revision</span>
          </button>
        </div>
      </div>
    </div>
  );
};
