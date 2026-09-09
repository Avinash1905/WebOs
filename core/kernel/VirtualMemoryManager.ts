/**
 * @file VirtualMemoryManager.ts
 * @description Virtual Memory Manager (VMM) supporting 4KB page allocations and memory mapping (mmap).
 */

export const PAGE_SIZE = 4096; // 4KB

export interface PageDescriptor {
  readonly pageIndex: number;
  readonly virtualAddress: number;
  readonly physicalAddress: number;
  isDirty: boolean;
  isAllocated: boolean;
  flags: number; // Read=1, Write=2, Exec=4
}

export class VirtualMemoryManager {
  private readonly pages = new Map<number, PageDescriptor>();
  private readonly memoryPages = new Map<number, Uint8Array>();
  private totalPagesAllocated = 0;

  constructor(private readonly maxPages = 65536) {} // 256MB max simulated RAM

  public allocatePages(pageCount: number, flags = 3): number {
    if (this.totalPagesAllocated + pageCount > this.maxPages) {
      throw new Error('ENOMEM: Virtual memory exhausted');
    }

    const startPageIndex = this.findFreeContiguousPages(pageCount);
    for (let i = 0; i < pageCount; i++) {
      const idx = startPageIndex + i;
      const desc: PageDescriptor = {
        pageIndex: idx,
        virtualAddress: idx * PAGE_SIZE,
        physicalAddress: idx * PAGE_SIZE,
        isDirty: false,
        isAllocated: true,
        flags
      };
      this.pages.set(idx, desc);
      this.memoryPages.set(idx, new Uint8Array(PAGE_SIZE));
      this.totalPagesAllocated++;
    }

    return startPageIndex * PAGE_SIZE;
  }

  public freePages(startAddress: number, pageCount: number): void {
    const startIdx = Math.floor(startAddress / PAGE_SIZE);
    for (let i = 0; i < pageCount; i++) {
      const idx = startIdx + i;
      if (this.pages.delete(idx)) {
        this.memoryPages.delete(idx);
        this.totalPagesAllocated--;
      }
    }
  }

  public writeMemory(address: number, data: Uint8Array): void {
    let offset = 0;
    while (offset < data.length) {
      const currentAddr = address + offset;
      const pageIdx = Math.floor(currentAddr / PAGE_SIZE);
      const pageOffset = currentAddr % PAGE_SIZE;

      const page = this.memoryPages.get(pageIdx);
      if (!page) throw new Error(`PageFault: Invalid virtual memory address 0x${currentAddr.toString(16)}`);

      const bytesToWrite = Math.min(data.length - offset, PAGE_SIZE - pageOffset);
      page.set(data.subarray(offset, offset + bytesToWrite), pageOffset);

      const desc = this.pages.get(pageIdx);
      if (desc) desc.isDirty = true;

      offset += bytesToWrite;
    }
  }

  public readMemory(address: number, length: number): Uint8Array {
    const result = new Uint8Array(length);
    let offset = 0;

    while (offset < length) {
      const currentAddr = address + offset;
      const pageIdx = Math.floor(currentAddr / PAGE_SIZE);
      const pageOffset = currentAddr % PAGE_SIZE;

      const page = this.memoryPages.get(pageIdx);
      if (!page) throw new Error(`PageFault: Invalid virtual memory address 0x${currentAddr.toString(16)}`);

      const bytesToRead = Math.min(length - offset, PAGE_SIZE - pageOffset);
      result.set(page.subarray(pageOffset, pageOffset + bytesToRead), offset);
      offset += bytesToRead;
    }

    return result;
  }

  public getMemoryStats(): { allocatedPages: number; maxPages: number; allocatedBytes: number; maxBytes: number } {
    return {
      allocatedPages: this.totalPagesAllocated,
      maxPages: this.maxPages,
      allocatedBytes: this.totalPagesAllocated * PAGE_SIZE,
      maxBytes: this.maxPages * PAGE_SIZE
    };
  }

  private findFreeContiguousPages(count: number): number {
    let currentStreak = 0;
    let startCandidate = 0;

    for (let i = 0; i < this.maxPages; i++) {
      if (!this.pages.has(i)) {
        if (currentStreak === 0) startCandidate = i;
        currentStreak++;
        if (currentStreak === count) return startCandidate;
      } else {
        currentStreak = 0;
      }
    }

    throw new Error('ENOMEM: Cannot find contiguous virtual pages');
  }
}
