/**
 * @file ChunkedIO.ts
 * @description Fixed-size chunked block manager for large VFS files.
 */

export interface BlockChunk {
  readonly blockIndex: number;
  readonly data: Uint8Array;
  readonly isDirty: boolean;
}

export class ChunkedIO {
  public readonly blockSize: number;
  private readonly blocks = new Map<number, Uint8Array>();
  private dirtyBlocks = new Set<number>();
  private totalSize = 0;

  constructor(blockSize = 4096) {
    this.blockSize = Math.max(64, blockSize);
  }

  public writeAt(offset: number, data: Uint8Array): number {
    if (offset < 0) throw new Error('Negative offset not allowed');
    let dataOffset = 0;

    while (dataOffset < data.length) {
      const currentOffset = offset + dataOffset;
      const blockIndex = Math.floor(currentOffset / this.blockSize);
      const blockOffset = currentOffset % this.blockSize;

      let block = this.blocks.get(blockIndex);
      if (!block) {
        block = new Uint8Array(this.blockSize);
        this.blocks.set(blockIndex, block);
      }

      const bytesToWrite = Math.min(data.length - dataOffset, this.blockSize - blockOffset);
      block.set(data.subarray(dataOffset, dataOffset + bytesToWrite), blockOffset);

      this.dirtyBlocks.add(blockIndex);
      dataOffset += bytesToWrite;
    }

    const endOffset = offset + data.length;
    if (endOffset > this.totalSize) {
      this.totalSize = endOffset;
    }

    return data.length;
  }

  public readAt(offset: number, length: number): Uint8Array {
    if (offset >= this.totalSize || length <= 0) {
      return new Uint8Array(0);
    }

    const actualLength = Math.min(length, this.totalSize - offset);
    const result = new Uint8Array(actualLength);
    let bytesRead = 0;

    while (bytesRead < actualLength) {
      const currentOffset = offset + bytesRead;
      const blockIndex = Math.floor(currentOffset / this.blockSize);
      const blockOffset = currentOffset % this.blockSize;

      const block = this.blocks.get(blockIndex);
      const bytesToRead = Math.min(actualLength - bytesRead, this.blockSize - blockOffset);

      if (block) {
        result.set(block.subarray(blockOffset, blockOffset + bytesToRead), bytesRead);
      } else {
        result.fill(0, bytesRead, bytesRead + bytesToRead);
      }

      bytesRead += bytesToRead;
    }

    return result;
  }

  public getTotalSize(): number {
    return this.totalSize;
  }

  public getBlockCount(): number {
    return this.blocks.size;
  }

  public getDirtyBlockCount(): number {
    return this.dirtyBlocks.size;
  }

  public flushDirty(): void {
    this.dirtyBlocks.clear();
  }

  public toUint8Array(): Uint8Array {
    return this.readAt(0, this.totalSize);
  }
}
