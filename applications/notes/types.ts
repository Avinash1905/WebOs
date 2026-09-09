/**
 * @file types.ts
 * @description Types and data contracts for WebOS Notes Application.
 */

export interface NoteRevision {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  tags: string[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  revisions: NoteRevision[];
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
}

export interface NoteTag {
  id: string;
  name: string;
  color: string;
}

export type NoteFilterCategory = 'all' | 'pinned' | 'favorites' | 'archived' | 'recent' | 'trash';

export interface NotesState {
  notes: NoteItem[];
  folders: NoteFolder[];
  tags: NoteTag[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  activeTagId: string | null;
  filterCategory: NoteFilterCategory;
  searchQuery: string;
  isSaving: boolean;
  isDirty: boolean;
  viewingRevision: NoteRevision | null;
}

export interface NotesActions {
  createNote: (folderId?: string | null, title?: string) => string;
  updateActiveNote: (updates: Partial<NoteItem>) => void;
  deleteNote: (noteId: string, permanent?: boolean) => void;
  duplicateNote: (noteId: string) => void;
  togglePinNote: (noteId: string) => void;
  toggleFavoriteNote: (noteId: string) => void;
  toggleArchiveNote: (noteId: string) => void;
  
  createFolder: (name: string, parentId?: string | null) => void;
  deleteFolder: (folderId: string) => void;
  
  createTag: (name: string, color?: string) => void;
  deleteTag: (tagId: string) => void;
  addTagToActiveNote: (tagName: string) => void;
  removeTagFromActiveNote: (tagName: string) => void;
  
  setActiveNote: (noteId: string | null) => void;
  setActiveFolder: (folderId: string | null) => void;
  setActiveTag: (tagId: string | null) => void;
  setFilterCategory: (category: NoteFilterCategory) => void;
  setSearchQuery: (query: string) => void;
  
  createRevisionSnapshot: () => void;
  restoreRevision: (revision: NoteRevision) => void;
  setViewingRevision: (revision: NoteRevision | null) => void;
  
  saveNotesToStorage: () => Promise<void>;
  loadNotesFromStorage: () => Promise<void>;
}
