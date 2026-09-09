import { describe, expect, it } from 'vitest';
import { RichMimeDataSerializer } from '../../core/clipboard/index.js';

describe('Rich MIME Data Serializer', () => {
  it('RichMimeDataSerializer serializes and deserializes compound multipart clipboard data', () => {
    const payloads = [
      { mimeType: 'text/plain', content: 'Plain text representation' },
      { mimeType: 'text/html', content: '<b>Rich HTML representation</b>' },
    ];

    const json = RichMimeDataSerializer.serialize(payloads);
    expect(json).toContain('text/plain');

    const deserialized = RichMimeDataSerializer.deserialize(json);
    expect(deserialized.length).toBe(2);
    expect(deserialized[1]!.mimeType).toBe('text/html');
  });
});
