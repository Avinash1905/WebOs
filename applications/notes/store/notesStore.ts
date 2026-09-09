/**
 * @file notesStore.ts
 * @description Isolated Zustand store for WebOS Notes application.
 */

import { create } from 'zustand';
import { platform } from '../../../src/services/webosPlatform.js';
import type { NotesState, NotesActions, NoteItem, NoteFolder, NoteTag, NoteRevision } from '../types.js';

const NOTES_STORAGE_KEY = 'webos_notes_data_v1';
let autosaveDebounceTimer: any = null;

const DEFAULT_FOLDERS: NoteFolder[] = [
  { id: 'f-work', name: 'Work', parentId: null, color: '#38bdf8' },
  { id: 'f-personal', name: 'Personal', parentId: null, color: '#a855f7' },
  { id: 'f-ideas', name: 'Ideas & Projects', parentId: null, color: '#22c55e' },
];

const DEFAULT_TAGS: NoteTag[] = [
  { id: 't-important', name: 'Important', color: '#ef4444' },
  { id: 't-todo', name: 'To-Do', color: '#f59e0b' },
  { id: 't-draft', name: 'Draft', color: '#64748b' },
];

const SAMPLE_NOTES: NoteItem[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to WebOS Notes',
    content: 'Welcome to **WebOS Notes**!\n\nFeatures supported:\n- Folders & Tagging\n- Markdown & Rich formatting\n- Checklists & Tasks\n- Revision history timeline\n- Automatic persistence',
    folderId: 'f-ideas',
    tags: ['Important'],
    isPinned: true,
    isFavorite: true,
    isArchived: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    revisions: [],
  },
];

export const useNotesStore = create<NotesState & NotesActions>((set, get) => ({
  notes: SAMPLE_NOTES,
  folders: DEFAULT_FOLDERS,
  tags: DEFAULT_TAGS,
  activeNoteId: 'note-welcome',
  activeFolderId: null,
  activeTagId: null,
  filterCategory: 'all',
  searchQuery: '',
  isSaving: false,
  isDirty: false,
  viewingRevision: null,

  createNote: (folderId = null, title = 'Untitled Note') => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      content: '',
      folderId: folderId || get().activeFolderId,
      tags: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      revisions: [],
    };

    const updated = [newNote, ...get().notes];
    set({ notes: updated, activeNoteId: newNote.id, isDirty: true });
    get().saveNotesToStorage();
    return newNote.id;
  },

  updateActiveNote: (updates) => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const targetIndex = notes.findIndex((n) => n.id === activeNoteId);
    if (targetIndex === -1) return;

    const currentNote = notes[targetIndex]!;
    const updatedNote: NoteItem = {
      ...currentNote,
      ...updates,
      updatedAt: Date.now(),
    };

    const updatedNotes = [...notes];
    updatedNotes[targetIndex] = updatedNote;

    set({ notes: updatedNotes, isDirty: true });

    // Debounced autosave + Periodic revision snapshot (if content changed significantly)
    if (autosaveDebounceTimer) clearTimeout(autosaveDebounceTimer);
    autosaveDebounceTimer = setTimeout(() => {
      get().createRevisionSnapshot();
      get().saveNotesToStorage();
    }, 2000);
  },

  deleteNote: (noteId, permanent = false) => {
    const { notes, activeNoteId } = get();
    let updated: NoteItem[];

    if (permanent) {
      updated = notes.filter((n) => n.id !== noteId);
    } else {
      updated = notes.map((n) => (n.id === noteId ? { ...n, isArchived: true } : n));
    }

    let nextActiveId = activeNoteId;
    if (activeNoteId === noteId) {
      const remaining = updated.filter((n) => !n.isArchived);
      nextActiveId = remaining.length > 0 ? remaining[0]!.id : null;
    }

    set({ notes: updated, activeNoteId: nextActiveId });
    get().saveNotesToStorage();
  },

  duplicateNote: (noteId) => {
    const { notes } = get();
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const dupNote: NoteItem = {
      ...target,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      revisions: [],
    };

    set({ notes: [dupNote, ...notes], activeNoteId: dupNote.id });
    get().saveNotesToStorage();
  },

  togglePinNote: (noteId) => {
    const { notes } = get();
    const updated = notes.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
    set({ notes: updated });
    get().saveNotesToStorage();
  },

  toggleFavoriteNote: (noteId) => {
    const { notes } = get();
    const updated = notes.map((n) => (n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n));
    set({ notes: updated });
    get().saveNotesToStorage();
  },

  toggleArchiveNote: (noteId) => {
    const { notes } = get();
    const updated = notes.map((n) => (n.id === noteId ? { ...n, isArchived: !n.isArchived } : n));
    set({ notes: updated });
    get().saveNotesToStorage();
  },

  createFolder: (name, parentId = null) => {
    const newFolder: NoteFolder = {
      id: `f-${Date.now()}`,
      name,
      parentId,
    };
    const updated = [...get().folders, newFolder];
    set({ folders: updated });
    get().saveNotesToStorage();
  },

  deleteFolder: (folderId) => {
    const updatedFolders = get().folders.filter((f) => f.id !== folderId);
    // Move notes in deleted folder to root
    const updatedNotes = get().notes.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n));
    set({ folders: updatedFolders, notes: updatedNotes });
    get().saveNotesToStorage();
  },

  createTag: (name, color = '#38bdf8') => {
    const newTag: NoteTag = {
      id: `t-${Date.now()}`,
      name,
      color,
    };
    set({ tags: [...get().tags, newTag] });
    get().saveNotesToStorage();
  },

  deleteTag: (tagId) => {
    const tag = get().tags.find((t) => t.id === tagId);
    if (!tag) return;
    const updatedTags = get().tags.filter((t) => t.id !== tagId);
    const updatedNotes = get().notes.map((n) => ({
      ...n,
      tags: n.tags.filter((tName) => tName !== tag.name),
    }));
    set({ tags: updatedTags, notes: updatedNotes });
    get().saveNotesToStorage();
  },

  addTagToActiveNote: (tagName) => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note || note.tags.includes(tagName)) return;

    get().updateActiveNote({ tags: [...note.tags, tagName] });
  },

  removeTagFromActiveNote: (tagName) => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    get().updateActiveNote({ tags: note.tags.filter((t) => t !== tagName) });
  },

  setActiveNote: (noteId) => set({ activeNoteId: noteId }),
  setActiveFolder: (folderId) => set({ activeFolderId: folderId, activeTagId: null, filterCategory: 'all' }),
  setActiveTag: (tagId) => set({ activeTagId: tagId, activeFolderId: null, filterCategory: 'all' }),
  setFilterCategory: (category) => set({ filterCategory: category, activeFolderId: null, activeTagId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  createRevisionSnapshot: () => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note || !note.content.trim()) return;

    // Only create snapshot if content changed from last snapshot
    const lastRev = note.revisions[note.revisions.length - 1];
    if (lastRev && lastRev.content === note.content) return;

    const snapshot: NoteRevision = {
      id: `rev-${Date.now()}`,
      timestamp: Date.now(),
      title: note.title,
      content: note.content,
      tags: [...note.tags],
    };

    const updatedRevisions = [...note.revisions, snapshot].slice(-20); // Keep last 20 revisions
    get().updateActiveNote({ revisions: updatedRevisions });
  },

  restoreRevision: (revision) => {
    const { activeNoteId } = get();
    if (!activeNoteId) return;

    get().updateActiveNote({
      title: revision.title,
      content: revision.content,
      tags: revision.tags,
    });
    set({ viewingRevision: null });
  },

  setViewingRevision: (revision) => set({ viewingRevision: revision }),

  saveNotesToStorage: async () => {
    set({ isSaving: true });
    try {
      await platform.initialize();
      const payload = {
        notes: get().notes,
        folders: get().folders,
        tags: get().tags,
      };
      await platform.storage.set(NOTES_STORAGE_KEY, payload);
      set({ isSaving: false, isDirty: false });
    } catch (err) {
      set({ isSaving: false });
    }
  },

  loadNotesFromStorage: async () => {
    try {
      await platform.initialize();
      const saved = await platform.storage.get<{ notes: NoteItem[]; folders: NoteFolder[]; tags: NoteTag[] }>(
        NOTES_STORAGE_KEY
      );

      if (saved && saved.notes && saved.notes.length > 0) {
        set({
          notes: saved.notes,
          folders: saved.folders || DEFAULT_FOLDERS,
          tags: saved.tags || DEFAULT_TAGS,
          activeNoteId: saved.notes[0]?.id || null,
        });
      }
    } catch {
      // Use initial state fallback
    }
  },
}));
