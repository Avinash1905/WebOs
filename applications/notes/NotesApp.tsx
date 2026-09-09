/**
 * @file NotesApp.tsx
 * @description Main application container for WebOS Notes.
 */

import React, { useEffect } from 'react';
import { useNotesStore } from './store/notesStore.js';
import { NotesSidebar } from './components/NotesSidebar.js';
import { NotesList } from './components/NotesList.js';
import { NotesEditor } from './components/NotesEditor.js';
import { NotesHistoryModal } from './components/NotesHistoryModal.js';
import './notes.css';

export interface NotesAppProps {
  windowId?: string;
  appId?: string;
}

export const NotesApp: React.FC<NotesAppProps> = () => {
  const { loadNotesFromStorage } = useNotesStore();

  useEffect(() => {
    loadNotesFromStorage();
  }, []);

  return (
    <div className="notes-app">
      {/* Navigation Folders & Tags Sidebar */}
      <NotesSidebar />

      {/* Notes Search & List Panel */}
      <NotesList />

      {/* Note Editor Area */}
      <NotesEditor />

      {/* Revision History Modal */}
      <NotesHistoryModal />
    </div>
  );
};

export default NotesApp;
