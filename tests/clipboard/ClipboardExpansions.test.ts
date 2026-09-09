import { describe, it, expect } from 'vitest';
import {
  MimeTypeClipboard,
  SecureClipboardManager,
  ClipboardHistoryRing
} from '../../core/clipboard/index.js';

describe('Clipboard Expansions', () => {
  describe('MimeTypeClipboard', () => {
    it('should hold multiple MIME representations and negotiate formats', () => {
      const clip = new MimeTypeClipboard();
      clip.setItem({
        'text/plain': 'Hello World',
        'text/html': '<b>Hello World</b>'
      });

      expect(clip.getText()).toBe('Hello World');
      expect(clip.getFormat('text/html')).toBe('<b>Hello World</b>');
      expect(clip.getAvailableFormats()).toContain('text/plain');
      expect(clip.getAvailableFormats()).toContain('text/html');
    });
  });

  describe('SecureClipboardManager', () => {
    it('should detect sensitive tokens and passwords', () => {
      const secure = new SecureClipboardManager();
      expect(secure.isSensitive('my_secret_password_123')).toBe(true);
      expect(secure.isSensitive('Bearer eyJhbGciOiJIUzI1NiJ9...')).toBe(true);
      expect(secure.isSensitive('Normal copied text')).toBe(false);
    });
  });

  describe('ClipboardHistoryRing', () => {
    it('should maintain circular history and preserve pinned entries', () => {
      const ring = new ClipboardHistoryRing(3); // capacity 3
      const c1 = ring.push('Item 1');
      ring.pin(c1.id);

      ring.push('Item 2');
      ring.push('Item 3');
      ring.push('Item 4'); // exceeds capacity -> evicts unpinned oldest (Item 2)

      const entries = ring.getEntries();
      expect(entries.some(e => e.id === c1.id)).toBe(true); // Pinned c1 is preserved
      expect(ring.search('Item').length).toBe(3);
    });
  });
});
