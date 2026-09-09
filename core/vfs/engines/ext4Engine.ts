/**
 * WebOS Linux Ext4 Journaling Filesystem Engine
 */

export interface Ext4Superblock {
  inodesCount: number;
  blocksCount: number;
  freeBlocksCount: number;
  freeInodesCount: number;
  firstDataBlock: number;
  blockSize: number;
  clusterSize: number;
  blocksPerGroup: number;
  clustersPerGroup: number;
  inodesPerGroup: number;
  magic: number; // 0xEF53
  state: number;
  errors: number;
  volumeName: string;
  uuid: string;
}

export interface Ext4BlockGroupDescriptor {
  blockBitmap: number;
  inodeBitmap: number;
  inodeTable: number;
  freeBlocksCount: number;
  freeInodesCount: number;
  usedDirsCount: number;
  flags: number;
}

export interface Ext4Inode {
  mode: number;
  uid: number;
  size: number;
  atime: number;
  ctime: number;
  mtime: number;
  dtime: number;
  gid: number;
  linksCount: number;
  blocksCount: number;
  flags: number;
  directBlocks: number[];
  indirectBlock: number;
  doubleIndirectBlock: number;
  tripleIndirectBlock: number;
}

export class Ext4FilesystemEngine {
  private superblock: Ext4Superblock;
  private blockGroups: Ext4BlockGroupDescriptor[] = [];
  private inodes: Map<number, Ext4Inode> = new Map();
  private dataBlocks: Map<number, Uint8Array> = new Map();

  constructor(volumeName = 'webos-rootfs') {
    this.superblock = {
      inodesCount: 65536,
      blocksCount: 262144, // 1GB in 4KB blocks
      freeBlocksCount: 250000,
      freeInodesCount: 65000,
      firstDataBlock: 1,
      blockSize: 4096,
      clusterSize: 4096,
      blocksPerGroup: 8192,
      clustersPerGroup: 8192,
      inodesPerGroup: 2048,
      magic: 0xEF53,
      state: 1, // Clean
      errors: 1, // Continue
      volumeName,
      uuid: '4a8e2b10-7c3d-4f5a-9e1b-2d3c4b5a6f7e',
    };
    this.initializeBlockGroups();
  }

  private initializeBlockGroups() {
    const groupCount = Math.ceil(this.superblock.blocksCount / this.superblock.blocksPerGroup);
    for (let i = 0; i < groupCount; i++) {
      this.blockGroups.push({
        blockBitmap: i * this.superblock.blocksPerGroup + 1,
        inodeBitmap: i * this.superblock.blocksPerGroup + 2,
        inodeTable: i * this.superblock.blocksPerGroup + 3,
        freeBlocksCount: 8000,
        freeInodesCount: 2000,
        usedDirsCount: 1,
        flags: 0,
      });
    }
  }

  public allocateInode(mode: number, uid: number, gid: number): number {
    const inodeNum = this.inodes.size + 1;
    const inode: Ext4Inode = {
      mode,
      uid,
      gid,
      size: 0,
      atime: Math.floor(Date.now() / 1000),
      ctime: Math.floor(Date.now() / 1000),
      mtime: Math.floor(Date.now() / 1000),
      dtime: 0,
      linksCount: 1,
      blocksCount: 0,
      flags: 0,
      directBlocks: [],
      indirectBlock: 0,
      doubleIndirectBlock: 0,
      tripleIndirectBlock: 0,
    };
    this.inodes.set(inodeNum, inode);
    this.superblock.freeInodesCount--;
    return inodeNum;
  }

  public writeInodeData(inodeNum: number, data: Uint8Array): void {
    const inode = this.inodes.get(inodeNum);
    if (!inode) throw new Error(`Inode ${inodeNum} not found`);

    inode.size = data.byteLength;
    inode.mtime = Math.floor(Date.now() / 1000);

    const neededBlocks = Math.ceil(data.byteLength / this.superblock.blockSize);
    inode.directBlocks = [];

    for (let i = 0; i < neededBlocks; i++) {
      const blockId = (inodeNum * 1000) + i;
      const chunk = data.subarray(i * 4096, (i + 1) * 4096);
      this.dataBlocks.set(blockId, chunk);
      inode.directBlocks.push(blockId);
    }
    inode.blocksCount = neededBlocks * 8; // 512-byte sectors
  }

  public readInodeData(inodeNum: number): Uint8Array {
    const inode = this.inodes.get(inodeNum);
    if (!inode) throw new Error(`Inode ${inodeNum} not found`);

    const result = new Uint8Array(inode.size);
    let offset = 0;
    for (const blockId of inode.directBlocks) {
      const chunk = this.dataBlocks.get(blockId);
      if (chunk) {
        const copyLen = Math.min(chunk.byteLength, inode.size - offset);
        result.set(chunk.subarray(0, copyLen), offset);
        offset += copyLen;
      }
    }
    return result;
  }

  public getSuperblock(): Ext4Superblock {
    return { ...this.superblock };
  }
}

export const ext4Engine = new Ext4FilesystemEngine();
