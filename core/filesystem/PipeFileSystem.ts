/**
 * @file PipeFileSystem.ts
 * @description Named Pipe (FIFO) /dev/pipe filesystem.
 */

export class PipeFileSystem {
  private readonly pipes = new Map<string, { buffer: Uint8Array; writePos: number; capacity: number }>();

  public createFIFO(name: string, capacity = 65536): void {
    this.pipes.set(name, {
      buffer: new Uint8Array(capacity),
      writePos: 0,
      capacity
    });
  }

  public writeFIFO(name: string, data: Uint8Array): number {
    const pipe = this.pipes.get(name);
    if (!pipe) throw new Error(`FIFO pipe ${name} does not exist`);

    const avail = pipe.capacity - pipe.writePos;
    const toWrite = Math.min(avail, data.length);

    pipe.buffer.set(data.subarray(0, toWrite), pipe.writePos);
    pipe.writePos += toWrite;
    return toWrite;
  }

  public readFIFO(name: string, maxBytes = 4096): Uint8Array {
    const pipe = this.pipes.get(name);
    if (!pipe || pipe.writePos === 0) return new Uint8Array(0);

    const toRead = Math.min(pipe.writePos, maxBytes);
    const result = pipe.buffer.slice(0, toRead);

    if (toRead < pipe.writePos) {
      pipe.buffer.copyWithin(0, toRead, pipe.writePos);
      pipe.writePos -= toRead;
    } else {
      pipe.writePos = 0;
    }

    return result;
  }
}
