/**
 * WebOS Core - Shared Memory Subsystem (shm_open, mmap, shm_unlink)
 */

import { SharedMemorySegment } from './types';

export class SharedMemoryManager {
  private static instance: SharedMemoryManager;
  private segments: Map<string, SharedMemorySegment> = new Map();

  private constructor() {}

  public static getInstance(): SharedMemoryManager {
    if (!SharedMemoryManager.instance) {
      SharedMemoryManager.instance = new SharedMemoryManager();
    }
    return SharedMemoryManager.instance;
  }

  public createSegment(name: string, sizeBytes: number, ownerPid: number, readOnly: boolean = false): SharedMemorySegment {
    const norm = name.startsWith('/') ? name : `/${name}`;
    if (this.segments.has(norm)) {
      throw new Error(`EEXIST: Shared memory segment '${norm}' already exists`);
    }

    const segment: SharedMemorySegment = {
      name: norm,
      size: sizeBytes,
      buffer: new ArrayBuffer(sizeBytes),
      ownerPid,
      attachedPids: new Set([ownerPid]),
      readOnly,
    };

    this.segments.set(norm, segment);
    return segment;
  }

  public openSegment(name: string, clientPid: number): SharedMemorySegment {
    const norm = name.startsWith('/') ? name : `/${name}`;
    const segment = this.segments.get(norm);
    if (!segment) {
      throw new Error(`ENOENT: Shared memory segment '${norm}' not found`);
    }
    segment.attachedPids.add(clientPid);
    return segment;
  }

  public detach(name: string, clientPid: number): void {
    const norm = name.startsWith('/') ? name : `/${name}`;
    const segment = this.segments.get(norm);
    if (segment) {
      segment.attachedPids.delete(clientPid);
    }
  }

  public unlink(name: string): boolean {
    const norm = name.startsWith('/') ? name : `/${name}`;
    return this.segments.delete(norm);
  }

  public listSegments(): Array<{ name: string; size: number; ownerPid: number; attachedCount: number }> {
    const list: Array<{ name: string; size: number; ownerPid: number; attachedCount: number }> = [];
    for (const seg of this.segments.values()) {
      list.push({
        name: seg.name,
        size: seg.size,
        ownerPid: seg.ownerPid,
        attachedCount: seg.attachedPids.size,
      });
    }
    return list;
  }
}

export const sharedMemory = SharedMemoryManager.getInstance();
