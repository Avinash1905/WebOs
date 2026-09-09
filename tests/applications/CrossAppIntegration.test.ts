/**
 * @file CrossAppIntegration.test.ts
 * @description End-to-end cross-application integration workflows between File Manager, Text Editor, Document Editor, and Notes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { platform } from '../../src/services/webosPlatform.js';
import { useFileManagerStore } from '../../applications/file-manager/store/fileManagerStore.js';
import { useTextEditorStore } from '../../applications/text-editor/store/textEditorStore.js';
import { useNotesStore } from '../../applications/notes/store/notesStore.js';
import { useDocumentEditorStore } from '../../applications/document-editor/store/documentEditorStore.js';

describe('Cross-Application Workflows', () => {
  beforeEach(async () => {
    await platform.initialize();
  });

  it('Workflow 1: File Manager -> Text Editor -> Edit -> Save -> Verify VFS Content', async () => {
    const fmStore = useFileManagerStore.getState();
    await fmStore.navigateTo('/home/user/Documents');

    // Create file in File Manager
    await fmStore.createFile('workflow1.txt', 'Original Text');
    expect(await platform.fileSystem.exists('/home/user/Documents/workflow1.txt')).toBe(true);

    // Open file in Text Editor
    const teStore = useTextEditorStore.getState();
    await teStore.openFileInEditor('/home/user/Documents/workflow1.txt');

    let teState = useTextEditorStore.getState();
    expect(teState.tabs.length).toBe(1);
    expect(teState.tabs[0]!.content).toBe('Original Text');

    // Edit content in Text Editor
    teStore.updateContent('Original Text\nAppended Line from Text Editor.');
    await teStore.saveActiveDocument();

    // Re-read file directly from VFS
    const updatedVFSContent = await platform.fileSystem.readFile(
      '/home/user/Documents/workflow1.txt',
      { encoding: 'utf-8' }
    );
    expect(updatedVFSContent).toBe('Original Text\nAppended Line from Text Editor.');
  });

  it('Workflow 2: File Manager -> Document Editor -> Add Heading, Paragraph, Table -> Save -> Reopen -> Verify', async () => {
    const docStore = useDocumentEditorStore.getState();
    
    // Add structured content
    docStore.addHeading(1, 'Executive Report');
    docStore.addParagraph(undefined, 'This report details WebOS Module 3.1 milestones.');
    docStore.addTable(2, 2);

    // Save Document As .wdoc in VFS
    await docStore.saveDocumentAs('/home/user/Documents/report.wdoc');
    expect(await platform.fileSystem.exists('/home/user/Documents/report.wdoc')).toBe(true);

    // Reset Document Editor State
    useDocumentEditorStore.setState({ document: {} as any });

    // Open again from File Manager / Document Editor
    await docStore.loadDocumentFromFile('/home/user/Documents/report.wdoc');

    const loadedDoc = useDocumentEditorStore.getState().document;
    expect(loadedDoc.title).toBe('report.wdoc');

    const blocks = loadedDoc.sections[0]!.blocks;
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    const hasHeading = blocks.some((b) => b.type === 'heading');
    const hasParagraph = blocks.some((b) => b.type === 'paragraph');
    const hasTable = blocks.some((b) => b.type === 'table');
    expect(hasHeading).toBe(true);
    expect(hasParagraph).toBe(true);
    expect(hasTable).toBe(true);
  });

  it('Workflow 3: Notes -> Create Note -> Add Tags -> Pin -> Edit -> Autosave -> Persistence Recovery', async () => {
    const notesStore = useNotesStore.getState();
    
    // Create & configure note
    const noteId = notesStore.createNote(null, 'Sprint Tasks');
    notesStore.addTagToActiveNote('Urgent');
    notesStore.togglePinNote(noteId);
    notesStore.updateActiveNote({ content: '1. Complete unit tests\n2. Verify production build' });

    // Save to storage
    await notesStore.saveNotesToStorage();

    // Reset store state
    useNotesStore.setState({ notes: [], activeNoteId: null });

    // Reload from StorageEngine
    await notesStore.loadNotesFromStorage();

    const recoveredNotes = useNotesStore.getState().notes;
    expect(recoveredNotes.length).toBeGreaterThan(0);

    const target = recoveredNotes.find((n) => n.id === noteId);
    expect(target).toBeDefined();
    expect(target!.title).toBe('Sprint Tasks');
    expect(target!.isPinned).toBe(true);
    expect(target!.tags).toContain('Urgent');
    expect(target!.content).toBe('1. Complete unit tests\n2. Verify production build');
  });
});
