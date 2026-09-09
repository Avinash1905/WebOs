import { describe, expect, it } from 'vitest';
import {
  ClipboardTransformPipeline,
  ClipboardSyncBridge,
  ClipboardHistoryStore,
  ClipboardSecurityFilter,
} from '../../core/clipboard/index.js';

describe('Clipboard Deep Subsystems', () => {
  it('ClipboardTransformPipeline converts HTML to text and strips ANSI escape codes', () => {
    const pipeline = new ClipboardTransformPipeline();

    const htmlInput = '<p>Hello <b>World</b></p><br/><span>Next Line</span>';
    const text = pipeline.apply('html-to-text', htmlInput);
    expect(text).toContain('Hello World');
    expect(text).toContain('Next Line');

    const ansiInput = '\x1b[31mRed Alert\x1b[0m';
    const plain = pipeline.apply('strip-ansi', ansiInput);
    expect(plain).toBe('Red Alert');

    const chained = pipeline.applyChain(['html-to-text', 'trim-lines'], '<p>  Text  </p>');
    expect(chained).toBe('Text');
  });

  it('ClipboardSyncBridge broadcasts sync messages across windows with sequence numbers', () => {
    const bridge = new ClipboardSyncBridge('win_primary');
    const received: any[] = [];

    const unsubscribe = bridge.onSync((msg) => received.push(msg));

    const msg1 = bridge.broadcast('text/plain', 'First copied message');
    expect(msg1.sequence).toBe(1);
    expect(msg1.senderId).toBe('win_primary');

    const msg2 = bridge.broadcast('text/html', '<b>Bold text</b>');
    expect(msg2.sequence).toBe(2);

    expect(received.length).toBe(2);
    unsubscribe();

    bridge.broadcast('text/plain', 'Third message');
    expect(received.length).toBe(2); // no new delivery after unsubscribe
  });

  it('ClipboardHistoryStore stores records, searches by content and respects max capacity', () => {
    const store = new ClipboardHistoryStore(3);

    store.push('Alpha content');
    store.push('Beta content');
    store.push('Gamma content');
    store.push('Delta content'); // Evicts Alpha

    const items = store.getItems(10);
    expect(items.length).toBe(3);
    expect(items.map((i) => i.content)).toEqual(['Delta content', 'Gamma content', 'Beta content']);

    const searchResults = store.search('gamma');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0]!.content).toBe('Gamma content');
  });

  it('ClipboardSecurityFilter scrubs API keys, private keys, and passwords', () => {
    const sensitive = 'Here is my api_key: "abc123secretkey456789" and password: mysecretpassword123';
    const result = ClipboardSecurityFilter.sanitize(sensitive);

    expect(result.wasRedacted).toBe(true);
    expect(result.detectedSensitiveTypes).toContain('API_KEY');
    expect(result.detectedSensitiveTypes).toContain('PASSWORD');
    expect(result.sanitized).toContain('api_key=[REDACTED]');
    expect(result.sanitized).toContain('password=[REDACTED]');
  });
});
