/**
 * WebOS Database - VFS Inode & Chunk Repository Layer
 */

export interface VFSInodeRecord {
  ino: number;
  user_id: string;
  path: string;
  name: string;
  type: string;
  size: number;
  mode: number;
  uid: number;
  gid: number;
  content_chunk?: Uint8Array;
  mtime: Date;
}

export class VFSRepository {
  private inMemoryDb: Map<string, VFSInodeRecord> = new Map();

  public async saveInode(record: VFSInodeRecord): Promise<boolean> {
    this.inMemoryDb.set(`${record.user_id}:${record.path}`, record);
    return true;
  }

  public async getInode(userId: string, path: string): Promise<VFSInodeRecord | null> {
    return this.inMemoryDb.get(`${userId}:${path}`) || null;
  }

  public async deleteInode(userId: string, path: string): Promise<boolean> {
    return this.inMemoryDb.delete(`${userId}:${path}`);
  }

  public async listUserInodes(userId: string): Promise<VFSInodeRecord[]> {
    const list: VFSInodeRecord[] = [];
    for (const [key, record] of this.inMemoryDb.entries()) {
      if (key.startsWith(`${userId}:`)) {
        list.push(record);
      }
    }
    return list;
  }
}

export const vfsRepository = new VFSRepository();
