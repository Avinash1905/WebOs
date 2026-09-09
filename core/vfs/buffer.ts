/**
 * WebOS Core - VFS Buffer & Binary Streaming Utilities
 * Resizable memory buffers, chunked stream reader/writer, encoding transformers.
 */

export class VFSBuffer {
  private data: Uint8Array;
  private length: number;

  constructor(initialCapacity: number = 1024) {
    this.data = new Uint8Array(initialCapacity);
    this.length = 0;
  }

  public static fromString(str: string, encoding: string = 'utf-8'): VFSBuffer {
    const buf = new VFSBuffer();
    if (typeof TextEncoder !== 'undefined' && (encoding === 'utf-8' || encoding === 'utf8')) {
      const encoded = new TextEncoder().encode(str);
      buf.writeBytes(encoded, 0);
    } else {
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xff;
      }
      buf.writeBytes(bytes, 0);
    }
    return buf;
  }

  public static fromBytes(bytes: Uint8Array): VFSBuffer {
    const buf = new VFSBuffer(bytes.length);
    buf.writeBytes(bytes, 0);
    return buf;
  }

  public get size(): number {
    return this.length;
  }

  public get capacity(): number {
    return this.data.length;
  }

  private ensureCapacity(needed: number) {
    if (needed <= this.data.length) return;
    let newCap = Math.max(needed, this.data.length * 2, 64);
    const next = new Uint8Array(newCap);
    next.set(this.data.subarray(0, this.length));
    this.data = next;
  }

  public writeBytes(source: Uint8Array, offset: number = this.length): number {
    const end = offset + source.length;
    this.ensureCapacity(end);
    this.data.set(source, offset);
    if (end > this.length) {
      this.length = end;
    }
    return source.length;
  }

  public readBytes(offset: number, length: number): Uint8Array {
    if (offset >= this.length) return new Uint8Array(0);
    const end = Math.min(this.length, offset + length);
    const sub = this.data.subarray(offset, end);
    const copy = new Uint8Array(sub.length);
    copy.set(sub);
    return copy;
  }

  public truncate(newLength: number) {
    if (newLength < 0) newLength = 0;
    if (newLength < this.length) {
      this.data.fill(0, newLength, this.length);
      this.length = newLength;
    } else if (newLength > this.length) {
      this.ensureCapacity(newLength);
      this.data.fill(0, this.length, newLength);
      this.length = newLength;
    }
  }

  public toBytes(): Uint8Array {
    return this.readBytes(0, this.length);
  }

  public toString(encoding: string = 'utf-8'): string {
    const slice = this.data.subarray(0, this.length);
    if (typeof TextDecoder !== 'undefined' && (encoding === 'utf-8' || encoding === 'utf8')) {
      return new TextDecoder().decode(slice);
    }
    let result = '';
    for (let i = 0; i < slice.length; i++) {
      result += String.fromCharCode(slice[i]);
    }
    return result;
  }

  public clone(): VFSBuffer {
    const c = new VFSBuffer(this.length);
    c.writeBytes(this.toBytes(), 0);
    return c;
  }
}
