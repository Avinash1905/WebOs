/**
 * @file SparseFileManager.ts
 * @description Sparse file block allocator and hole punching manager.
 */

export class SparseFileManager {
  private readonly allocatedBlocks = new Map<number, Uint8Array>();
  private readonly blockSize: number;
  private virtualLength = 0;

  constructor(blockSize = 4096) {
    this.blockSize = blockSize;
  }

  public setLength(length: number): void {
    this.virtualLength = length;
  }

  public writeAt(offset: number, data: Uint8Array): void {
    let written = 0;
    while (written < data.length) {
      const currentPos = offset + written;
      const blockIdx = Math.floor(currentPos / this.blockSize);
      const blockOffset = currentPos % this.blockSize;

      let block = this.allocatedBlocks.get(blockIdx);
      if (!block) {
        block = new Uint8Array(this.blockSize);
        this.allocatedBlocks.set(blockIdx, block);
      }

      const toWrite = Math.min(data.length - written, this.blockSize - blockOffset);
      block.set(data.subarray(written, written + toWrite), blockOffset);
      written += toWrite;
    }

    if (offset + data.length > this.virtualLength) {
      this.virtualLength = offset + data.length;
    }
  }

  public punchHole(offset: number, length: number): void {
    const startBlock = Math.floor(offset / this.blockSize);
    const endBlock = Math.floor((offset + length) / this.blockSize);

    for (let b = startBlock; b <= endBlock; b++) {
      this.allocatedBlocks.delete(b); // Deallocate block to create hole
    }
  }

  public getActualBytesAllocated(): number {
    return this.allocatedBlocks.size * this.blockSize;
  }

  public getVirtualLength(): number {
    return this.virtualLength;
  }
}
