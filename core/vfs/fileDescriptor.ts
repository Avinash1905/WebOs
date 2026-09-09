/**
 * WebOS Core - File Descriptor Table
 * Manages open file handles, read/write offsets, process file descriptor spaces, and open flags.
 */

import { FileDescriptor, VFSOpenFlags, VFSSeekOrigin } from './types';

export class FileDescriptorTable {
  private descriptors: Map<number, FileDescriptor> = new Map();
  private nextFd: number = 3; // 0: stdin, 1: stdout, 2: stderr

  constructor() {}

  public open(
    ino: number,
    path: string,
    flags: number,
    processId: number = 1
  ): FileDescriptor {
    const fd = this.nextFd++;
    const isReadOnly = (flags & 3) === VFSOpenFlags.O_RDONLY;
    const isWriteOnly = (flags & 3) === VFSOpenFlags.O_WRONLY;
    const isReadWrite = (flags & 3) === VFSOpenFlags.O_RDWR;

    const descriptor: FileDescriptor = {
      fd,
      ino,
      path,
      flags,
      offset: 0,
      openedAt: Date.now(),
      processId,
      readable: isReadOnly || isReadWrite,
      writable: isWriteOnly || isReadWrite,
    };

    this.descriptors.set(fd, descriptor);
    return descriptor;
  }

  public get(fd: number): FileDescriptor | undefined {
    return this.descriptors.get(fd);
  }

  public close(fd: number): boolean {
    return this.descriptors.delete(fd);
  }

  public seek(fd: number, offset: number, origin: VFSSeekOrigin, fileSize: number): number {
    const desc = this.descriptors.get(fd);
    if (!desc) {
      throw new Error(`EBADF: Bad file descriptor ${fd}`);
    }

    let newOffset = desc.offset;
    switch (origin) {
      case VFSSeekOrigin.SEEK_SET:
        newOffset = offset;
        break;
      case VFSSeekOrigin.SEEK_CUR:
        newOffset = desc.offset + offset;
        break;
      case VFSSeekOrigin.SEEK_END:
        newOffset = fileSize + offset;
        break;
    }

    if (newOffset < 0) {
      throw new Error(`EINVAL: Invalid seek offset ${newOffset}`);
    }

    desc.offset = newOffset;
    return desc.offset;
  }

  public closeProcessDescriptors(processId: number): number {
    let closed = 0;
    for (const [fd, desc] of this.descriptors.entries()) {
      if (desc.processId === processId) {
        this.descriptors.delete(fd);
        closed++;
      }
    }
    return closed;
  }

  public listOpen(): FileDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  public clear() {
    this.descriptors.clear();
    this.nextFd = 3;
  }
}
