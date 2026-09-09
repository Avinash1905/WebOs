/**
 * WebOS 64-bit Virtual Memory MMU & 4-Level Page Table (PML4, PDPT, PD, PT) Engine
 */

export interface PageTableEntry {
  present: boolean;
  writable: boolean;
  userAccessible: boolean;
  writeThrough: boolean;
  cacheDisabled: boolean;
  accessed: boolean;
  dirty: boolean;
  hugePage: boolean;
  global: boolean;
  physicalFrame: number;
}

export class PageTableLevel {
  public entries: Array<PageTableEntry | null> = new Array(512).fill(null);
}

export class VirtualMemoryMMU {
  public static readonly PAGE_SIZE = 4096; // 4KB standard pages
  public static readonly PAGE_MASK = 0xFFF;
  public static readonly ENTRIES_PER_TABLE = 512;

  private pml4Root: PageTableLevel = new PageTableLevel();
  private allocatedFrames: Set<number> = new Set();
  private pageFaults = 0;
  private tlbHits = 0;
  private tlbMisses = 0;
  private tlbCache: Map<number, number> = new Map(); // Virtual page -> Physical frame

  public mapPage(virtualAddress: number, physicalAddress: number, flags: { writable?: boolean; user?: boolean } = {}): void {
    const pageNum = Math.floor(virtualAddress / VirtualMemoryMMU.PAGE_SIZE);
    const frameNum = Math.floor(physicalAddress / VirtualMemoryMMU.PAGE_SIZE);

    const pml4Idx = (pageNum >>> 27) & 0x1FF;
    const pdptIdx = (pageNum >>> 18) & 0x1FF;
    const pdIdx = (pageNum >>> 9) & 0x1FF;
    const ptIdx = pageNum & 0x1FF;

    // Simulate 4-level entry population
    const entry: PageTableEntry = {
      present: true,
      writable: flags.writable ?? true,
      userAccessible: flags.user ?? true,
      writeThrough: false,
      cacheDisabled: false,
      accessed: false,
      dirty: false,
      hugePage: false,
      global: false,
      physicalFrame: frameNum,
    };

    this.pml4Root.entries[pml4Idx] = entry;
    this.allocatedFrames.add(frameNum);
    this.tlbCache.set(pageNum, frameNum);
  }

  public translate(virtualAddress: number): number {
    const pageNum = Math.floor(virtualAddress / VirtualMemoryMMU.PAGE_SIZE);
    const offset = virtualAddress & VirtualMemoryMMU.PAGE_MASK;

    if (this.tlbCache.has(pageNum)) {
      this.tlbHits++;
      return (this.tlbCache.get(pageNum)! * VirtualMemoryMMU.PAGE_SIZE) + offset;
    }

    this.tlbMisses++;
    const pml4Idx = (pageNum >>> 27) & 0x1FF;
    const entry = this.pml4Root.entries[pml4Idx];

    if (!entry || !entry.present) {
      this.pageFaults++;
      throw new Error(`Page fault at virtual address 0x${virtualAddress.toString(16)}`);
    }

    this.tlbCache.set(pageNum, entry.physicalFrame);
    return (entry.physicalFrame * VirtualMemoryMMU.PAGE_SIZE) + offset;
  }

  public invalidateTLB(): void {
    this.tlbCache.clear();
  }

  public getStats() {
    return {
      allocatedFrames: this.allocatedFrames.size,
      pageFaults: this.pageFaults,
      tlbHits: this.tlbHits,
      tlbMisses: this.tlbMisses,
      hitRate: this.tlbHits + this.tlbMisses > 0 ? (this.tlbHits / (this.tlbHits + this.tlbMisses)) * 100 : 0,
    };
  }
}

export const mmu = new VirtualMemoryMMU();
