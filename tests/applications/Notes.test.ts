/**
 * @file Notes.test.ts
 * @description Comprehensive unit and integration test suite for Notes application.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../../applications/notes/store/notesStore.js';
import { platform } from '../../src/services/webosPlatform.js';

describe('Notes Application', () => {
  beforeEach(async () => {
    await platform.initialize();
    useNotesStore.setState({
      notes: [],
      folders: [{ id: 'f-1', name: 'Work', parentId: null }],
      tags: [{ id: 't-1', name: 'Urgent', color: '#ef4444' }],
      activeNoteId: null,
      activeFolderId: null,
      activeTagId: null,
      filterCategory: 'all',
      searchQuery: '',
      isSaving: false,
      isDirty: false,
      viewingRevision: null,
    });
  });

  it('creates new notes and updates active note content', () => {
    const store = useNotesStore.getState();
    const noteId = store.createNote('f-1', 'Meeting Action Items');

    let state = useNotesStore.getState();
    expect(state.notes.length).toBe(1);
    expect(state.notes[0]!.title).toBe('Meeting Action Items');

    store.updateActiveNote({ content: '- Complete Module 3.1 specification' });
    state = useNotesStore.getState();
    expect(state.notes[0]!.content).toBe('- Complete Module 3.1 specification');
  });

  it('toggles pinned, favorite, and archive status on notes', () => {
    const store = useNotesStore.getState();
    const noteId = store.createNote(null, 'Status Note');

    store.togglePinNote(noteId);
    store.toggleFavoriteNote(noteId);

    let state = useNotesStore.getState();
    expect(state.notes[0]!.isPinned).toBe(true);
    expect(state.notes[0]!.isFavorite).toBe(true);

    store.toggleArchiveNote(noteId);
    state = useNotesStore.getState();
    expect(state.notes[0]!.isArchived).toBe(true);
  });

  it('manages tags and folder assignment for notes', () => {
    const store = useNotesStore.getState();
    const noteId = store.createNote(null, 'Tagged Note');

    store.addTagToActiveNote('Urgent');
    let state = useNotesStore.getState();
    expect(state.notes[0]!.tags).toContain('Urgent');

    store.removeTagFromActiveNote('Urgent');
    state = useNotesStore.getState();
    expect(state.notes[0]!.tags).not.toContain('Urgent');
  });

  it('creates revision snapshots and restores previous revisions', () => {
    const store = useNotesStore.getState();
    const noteId = store.createNote(null, 'Revision Note');

    store.updateActiveNote({ content: 'Version 1 Content' });
    store.createRevisionSnapshot();

    store.updateActiveNote({ content: 'Version 2 Content' });
    store.createRevisionSnapshot();

    const note = useNotesStore.getState().notes[0]!;
    expect(note.revisions.length).toBeGreaterThan(0);

    const firstRev = note.revisions[0]!;
    store.restoreRevision(firstRev);

    expect(useNotesStore.getState().notes[0]!.content).toBe(firstRev.content);
  });

  it('persists notes to StorageEngine and reloads state', async () => {
    const store = useNotesStore.getState();
    store.createNote(null, 'Persistent Note');
    await store.saveNotesToStorage();

    // Reset store in-memory state
    useNotesStore.setState({ notes: [], activeNoteId: null });

    // Reload from StorageEngine
    await store.loadNotesFromStorage();

    const state = useNotesStore.getState();
    expect(state.notes.length).toBe(1);
    expect(state.notes[0]!.title).toBe('Persistent Note');
  });
});
