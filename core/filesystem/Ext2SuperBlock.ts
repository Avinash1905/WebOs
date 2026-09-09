/**
 * @file Ext2SuperBlock.ts
 * @description Simulated Ext2/Ext4 superblock, block groups, and inode bitmaps.
 */

export interface SuperBlockData {
  readonly totalInodes: number;
  readonly totalBlocks: number;
  readonly blockSize: number;
  readonly freeBlocksCount: number;
  readonly freeInodesCount: number;
  readonly mountCount: number;
}

export class Ext2SuperBlock {
  private freeBlocks: number;
  private freeInodes: number;
  private mountCount = 0;

  constructor(
    public readonly totalInodes = 32768,
    public readonly totalBlocks = 65536,
    public readonly blockSize = 4096
  ) {
    this.freeBlocks = totalBlocks;
    this.freeInodes = totalInodes;
  }

  public allocateBlock(): number {
    if (this.freeBlocks <= 0) throw new Error('ENOSPC: No free disk blocks available');
    this.freeBlocks--;
    return this.totalBlocks - this.freeBlocks;
  }

  public freeBlock(): void {
    this.freeBlocks = Math.min(this.totalBlocks, this.freeBlocks + 1);
  }

  public allocateInode(): number {
    if (this.freeInodes <= 0) throw new Error('ENOSPC: No free inodes available');
    this.freeInodes--;
    return this.totalInodes - this.freeInodes;
  }

  public freeInode(): void {
    this.freeInodes = Math.min(this.totalInodes, this.freeInodes + 1);
  }

  public recordMount(): void {
    this.mountCount++;
  }

  public getSummary(): SuperBlockData {
    return {
      totalInodes: this.totalInodes,
      totalBlocks: this.totalBlocks,
      blockSize: this.blockSize,
      freeBlocksCount: this.freeBlocks,
      freeInodesCount: this.freeInodes,
      mountCount: this.mountCount
    };
  }
}
