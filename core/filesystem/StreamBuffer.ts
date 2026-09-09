/**
 * @file StreamBuffer.ts
 * @description Cursor-based in-memory byte streaming buffer for VFS streaming IO.
 */

export class StreamBuffer {
  private buffer: Uint8Array;
  private position = 0;
  private length = 0;

  constructor(initialCapacity = 1024) {
    this.buffer = new Uint8Array(Math.max(initialCapacity, 64));
  }

  public static fromString(text: string, _encoding: 'utf-8' = 'utf-8'): StreamBuffer {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const stream = new StreamBuffer(data.length);
    stream.write(data);
    stream.seek(0);
    return stream;
  }

  public static fromUint8Array(data: Uint8Array): StreamBuffer {
    const stream = new StreamBuffer(data.length);
    stream.write(data);
    stream.seek(0);
    return stream;
  }

  public write(chunk: Uint8Array): number {
    const needed = this.position + chunk.length;
    this.ensureCapacity(needed);

    this.buffer.set(chunk, this.position);
    this.position += chunk.length;
    if (this.position > this.length) {
      this.length = this.position;
    }
    return chunk.length;
  }

  public writeString(text: string): number {
    const encoder = new TextEncoder();
    return this.write(encoder.encode(text));
  }

  public read(maxBytes: number): Uint8Array {
    if (this.position >= this.length || maxBytes <= 0) {
      return new Uint8Array(0);
    }

    const available = this.length - this.position;
    const toRead = Math.min(available, maxBytes);
    const result = this.buffer.slice(this.position, this.position + toRead);
    this.position += toRead;
    return result;
  }

  public readString(maxBytes = 65536): string {
    const chunk = this.read(maxBytes);
    const decoder = new TextDecoder();
    return decoder.decode(chunk);
  }

  public readAll(): Uint8Array {
    this.seek(0);
    return this.read(this.length);
  }

  public readAllAsString(): string {
    this.seek(0);
    return this.readString(this.length);
  }

  public seek(offset: number, from: 'start' | 'current' | 'end' = 'start'): number {
    let target = 0;
    switch (from) {
      case 'start':
        target = offset;
        break;
      case 'current':
        target = this.position + offset;
        break;
      case 'end':
        target = this.length + offset;
        break;
    }

    this.position = Math.max(0, Math.min(target, this.length));
    return this.position;
  }

  public tell(): number {
    return this.position;
  }

  public size(): number {
    return this.length;
  }

  public isEOF(): boolean {
    return this.position >= this.length;
  }

  public truncate(newLength = 0): void {
    const safeLength = Math.max(0, newLength);
    if (safeLength < this.length) {
      this.buffer.fill(0, safeLength, this.length);
      this.length = safeLength;
      if (this.position > this.length) {
        this.position = this.length;
      }
    }
  }

  private ensureCapacity(capacity: number): void {
    if (this.buffer.length >= capacity) return;
    let nextCap = this.buffer.length * 2;
    while (nextCap < capacity) {
      nextCap *= 2;
    }
    const next = new Uint8Array(nextCap);
    next.set(this.buffer);
    this.buffer = next;
  }
}
