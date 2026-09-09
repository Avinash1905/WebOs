import { describe, it, expect, beforeEach } from 'vitest';
import { ClipboardManager } from '../../core/clipboard/ClipboardManager.js';
import { EventBus } from '../../core/events/EventBus.js';
import { StorageEngine } from '../../core/storage/StorageEngine.js';
import { FileSystem } from '../../core/filesystem/FileSystem.js';
import { EmptyClipboardError, InvalidClipboardDataError } from '../../core/clipboard/ClipboardError.js';

describe('ClipboardManager', () => {
  let eventBus: EventBus;
  let storage: StorageEngine;
  let fs: FileSystem;
  let clipboard: ClipboardManager;

  beforeEach(async () => {
    eventBus = new EventBus();
    storage = new StorageEngine({ adapter: 'memory' });
    await storage.initialize();
    await storage.start();

    fs = new FileSystem({ eventBus, storage });
    await fs.initialize();
    await fs.start();

    // Ensure /home/user directory structure exists
    if (!(await fs.exists('/home'))) {
      await fs.createDirectory('/home', undefined, { isSystem: true });
    }
    if (!(await fs.exists('/home/user'))) {
      await fs.createDirectory('/home/user', undefined, { isSystem: true });
    }

    clipboard = new ClipboardManager({
      eventBus,
      fileSystem: fs,
      storage,
      maxHistorySize: 5,
    });
    await clipboard.initialize();
    await clipboard.start();
  });

  it('should set and get plain text data', async () => {
    const item = clipboard.set('text', 'Hello WebOS', {
      sourceApp: 'notepad',
      userId: 'user1',
    });

    expect(item.id).toBeDefined();
    expect(item.type).toBe('text');
    expect(item.value).toBe('Hello WebOS');
    expect(item.operation).toBe('copy');

    const current = clipboard.get<string>();
    expect(current).not.toBeNull();
    expect(current?.value).toBe('Hello WebOS');

    const text = await clipboard.readText();
    expect(text).toBe('Hello WebOS');
  });

  it('should support writeText and copy shortcuts', async () => {
    await clipboard.writeText('Short text');
    expect(await clipboard.readText()).toBe('Short text');

    clipboard.copy('custom', { foo: 'bar' });
    expect(clipboard.get()?.value).toEqual({ foo: 'bar' });
  });

  it('should throw InvalidClipboardDataError on null or undefined value', () => {
    expect(() => clipboard.set('text', null as any)).toThrow(InvalidClipboardDataError);
    expect(() => clipboard.set('text', undefined as any)).toThrow(InvalidClipboardDataError);
  });

  it('should paste text to a destination VFS file', async () => {
    clipboard.copy('text', 'Saved to file');
    const pasted = await clipboard.paste('/home/user/note.txt');

    expect(pasted).toBe('Saved to file');
    const content = await fs.readFile('/home/user/note.txt');
    expect(content).toBe('Saved to file');
  });

  it('should handle VFS file copy and paste', async () => {
    await fs.createFile('/home/user/src.txt', { content: 'File payload' });

    clipboard.copy('file', '/home/user/src.txt', { sourcePath: '/home/user/src.txt' });
    expect(clipboard.get()?.operation).toBe('copy');

    await clipboard.paste('/home/user/dest.txt');
    expect(await fs.exists('/home/user/src.txt')).toBe(true);
    expect(await fs.exists('/home/user/dest.txt')).toBe(true);
    expect(await fs.readFile('/home/user/dest.txt')).toBe('File payload');
  });

  it('should handle VFS file cut and paste (move)', async () => {
    await fs.createFile('/home/user/to_move.txt', { content: 'Moving this' });

    clipboard.cut('file', '/home/user/to_move.txt', { sourcePath: '/home/user/to_move.txt' });
    expect(clipboard.get()?.operation).toBe('cut');

    await clipboard.paste('/home/user/moved.txt');
    expect(await fs.exists('/home/user/to_move.txt')).toBe(false);
    expect(await fs.exists('/home/user/moved.txt')).toBe(true);
    expect(await fs.readFile('/home/user/moved.txt')).toBe('Moving this');

    // Clipboard is cleared after cut paste
    expect(clipboard.isEmpty()).toBe(true);
  });

  it('should throw EmptyClipboardError when pasting an empty clipboard', async () => {
    clipboard.clear();
    await expect(clipboard.paste()).rejects.toThrow(EmptyClipboardError);
  });

  it('should maintain a bounded history buffer and allow restoration', () => {
    for (let i = 1; i <= 7; i++) {
      clipboard.set('text', `Item ${i}`);
    }

    const history = clipboard.getHistory();
    expect(history.length).toBe(5); // bounded to maxHistorySize: 5
    expect(history[0]?.value).toBe('Item 7');
    expect(history[4]?.value).toBe('Item 3');

    const restoredId = history[2]!.id;
    const restored = clipboard.restoreFromHistory(restoredId);
    expect(restored).not.toBeNull();
    expect(clipboard.get()?.value).toBe('Item 5');
  });

  it('should emit events on clipboard operations', async () => {
    const events: string[] = [];
    eventBus.subscribe('CLIPBOARD_CHANGED', () => { events.push('CHANGED'); });
    eventBus.subscribe('CLIPBOARD_COPIED', () => { events.push('COPIED'); });
    eventBus.subscribe('CLIPBOARD_CUT', () => { events.push('CUT'); });
    eventBus.subscribe('CLIPBOARD_PASTED', () => { events.push('PASTED'); });
    eventBus.subscribe('CLIPBOARD_CLEARED', () => { events.push('CLEARED'); });

    clipboard.copy('text', 'Test Event');
    clipboard.cut('text', 'Cut Event');
    await clipboard.paste();
    clipboard.clear();

    expect(events).toContain('CHANGED');
    expect(events).toContain('COPIED');
    expect(events).toContain('CUT');
    expect(events).toContain('PASTED');
    expect(events).toContain('CLEARED');
  });
});
