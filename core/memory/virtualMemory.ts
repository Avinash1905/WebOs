/**
 * WebOS Core - Virtual Memory Management Subsystem
 * Implements Paging, Virtual Address Translation, Page Allocation, and Memory Statistics.
 */

export interface PageTableEntry {
  virtualPageNumber: number;
  physicalFrameNumber: number;
  present: boolean;
  readWrite: boolean;
  userSupervisor: boolean;
  accessed: boolean;
  dirty: boolean;
  cachingDisabled: boolean;
}

export interface MemorySegment {
  name: string;
  startAddress: number;
  size: number;
  permissions: 'r--' | 'rw-' | 'r-x' | 'rwx';
  allocatedBytes: number;
}

export interface MemoryStats {
  totalMemoryBytes: number;
  usedMemoryBytes: number;
  freeMemoryBytes: number;
  pageSize: number;
  totalPages: number;
  allocatedPages: number;
  freePages: number;
  pageFaultCount: number;
  swapUsageBytes: number;
}

export class MemoryBlock {
  public address: number;
  public size: number;
  public isFree: boolean;
  public next: MemoryBlock | null = null;
  public prev: MemoryBlock | null = null;

  constructor(address: number, size: number, isFree: boolean = true) {
    this.address = address;
    this.size = size;
    this.isFree = isFree;
  }
}

export class VirtualMemoryManager {
  private static instance: VirtualMemoryManager;

  public static readonly PAGE_SIZE = 4096; // 4KB Pages
  public static readonly TOTAL_SYSTEM_RAM = 64 * 1024 * 1024; // 64 MB Virtual RAM
  public static readonly TOTAL_FRAMES = VirtualMemoryManager.TOTAL_SYSTEM_RAM / VirtualMemoryManager.PAGE_SIZE;

  private frameBitmap: Uint8Array;
  private pageTables: Map<number, Map<number, PageTableEntry>> = new Map(); // pid -> (vpn -> entry)
  private processSegments: Map<number, MemorySegment[]> = new Map(); // pid -> segments
  private memoryBlocks: Map<number, MemoryBlock> = new Map(); // pid -> heap head block
  private rawPhysicalRAM: ArrayBuffer;
  private ramView: DataView;
  private pageFaults: number = 0;
  private swapUsage: number = 0;

  private constructor() {
    this.frameBitmap = new Uint8Array(Math.ceil(VirtualMemoryManager.TOTAL_FRAMES / 8));
    this.rawPhysicalRAM = new ArrayBuffer(VirtualMemoryManager.TOTAL_SYSTEM_RAM);
    this.ramView = new DataView(this.rawPhysicalRAM);
  }

  public static getInstance(): VirtualMemoryManager {
    if (!VirtualMemoryManager.instance) {
      VirtualMemoryManager.instance = new VirtualMemoryManager();
    }
    return VirtualMemoryManager.instance;
  }

  public initializeProcessAddressSpace(pid: number): void {
    const pageTable = new Map<number, PageTableEntry>();
    this.pageTables.set(pid, pageTable);

    // Standard UNIX-style address layout
    const segments: MemorySegment[] = [
      { name: 'TEXT', startAddress: 0x00400000, size: 64 * 1024, permissions: 'r-x', allocatedBytes: 0 },
      { name: 'DATA', startAddress: 0x00500000, size: 32 * 1024, permissions: 'rw-', allocatedBytes: 0 },
      { name: 'BSS',  startAddress: 0x00580000, size: 32 * 1024, permissions: 'rw-', allocatedBytes: 0 },
      { name: 'HEAP', startAddress: 0x01000000, size: 16 * 1024 * 1024, permissions: 'rw-', allocatedBytes: 0 },
      { name: 'STACK', startAddress: 0x7FFF0000, size: 8 * 1024 * 1024, permissions: 'rw-', allocatedBytes: 0 },
    ];
    this.processSegments.set(pid, segments);

    // Initialize Heap Free List
    const heapHead = new MemoryBlock(0x01000000, 16 * 1024 * 1024, true);
    this.memoryBlocks.set(pid, heapHead);
  }

  public destroyProcessAddressSpace(pid: number): void {
    const table = this.pageTables.get(pid);
    if (table) {
      for (const entry of table.values()) {
        if (entry.present) {
          this.freePhysicalFrame(entry.physicalFrameNumber);
        }
      }
      this.pageTables.delete(pid);
    }
    this.processSegments.delete(pid);
    this.memoryBlocks.delete(pid);
  }

  public allocatePhysicalFrame(): number {
    for (let frame = 0; frame < VirtualMemoryManager.TOTAL_FRAMES; frame++) {
      const byteIdx = Math.floor(frame / 8);
      const bitIdx = frame % 8;
      if ((this.frameBitmap[byteIdx] & (1 << bitIdx)) === 0) {
        // Mark as allocated
        this.frameBitmap[byteIdx] |= (1 << bitIdx);
        return frame;
      }
    }
    throw new Error('OOM: Out of physical memory frames');
  }

  public freePhysicalFrame(frameNumber: number): void {
    if (frameNumber < 0 || frameNumber >= VirtualMemoryManager.TOTAL_FRAMES) return;
    const byteIdx = Math.floor(frameNumber / 8);
    const bitIdx = frameNumber % 8;
    this.frameBitmap[byteIdx] &= ~(1 << bitIdx);
  }

  public mapVirtualPage(
    pid: number,
    virtualPageNumber: number,
    readWrite: boolean = true,
    userSupervisor: boolean = true
  ): PageTableEntry {
    let table = this.pageTables.get(pid);
    if (!table) {
      this.initializeProcessAddressSpace(pid);
      table = this.pageTables.get(pid)!;
    }

    let entry = table.get(virtualPageNumber);
    if (!entry) {
      const frameNumber = this.allocatePhysicalFrame();
      entry = {
        virtualPageNumber,
        physicalFrameNumber: frameNumber,
        present: true,
        readWrite,
        userSupervisor,
        accessed: false,
        dirty: false,
        cachingDisabled: false,
      };
      table.set(virtualPageNumber, entry);
    }
    return entry;
  }

  public translateAddress(pid: number, virtualAddress: number, isWrite: boolean = false): number {
    const vpn = Math.floor(virtualAddress / VirtualMemoryManager.PAGE_SIZE);
    const offset = virtualAddress % VirtualMemoryManager.PAGE_SIZE;

    const table = this.pageTables.get(pid);
    if (!table) {
      this.pageFaults++;
      throw new Error(`SIGSEGV: Invalid page table for PID ${pid}`);
    }

    let entry = table.get(vpn);
    if (!entry || !entry.present) {
      // Page Fault handling (Demand Paging)
      this.pageFaults++;
      entry = this.mapVirtualPage(pid, vpn, true, true);
    }

    if (isWrite && !entry.readWrite) {
      throw new Error(`SIGSEGV: Page write permission violation at 0x${virtualAddress.toString(16)}`);
    }

    entry.accessed = true;
    if (isWrite) {
      entry.dirty = true;
    }

    return (entry.physicalFrameNumber * VirtualMemoryManager.PAGE_SIZE) + offset;
  }

  public readUInt8(pid: number, virtualAddress: number): number {
    const physicalAddress = this.translateAddress(pid, virtualAddress, false);
    return this.ramView.getUint8(physicalAddress);
  }

  public writeUInt8(pid: number, virtualAddress: number, value: number): void {
    const physicalAddress = this.translateAddress(pid, virtualAddress, true);
    this.ramView.setUint8(physicalAddress, value & 0xFF);
  }

  public readBytes(pid: number, virtualAddress: number, length: number): Uint8Array {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = this.readUInt8(pid, virtualAddress + i);
    }
    return result;
  }

  public writeBytes(pid: number, virtualAddress: number, data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      this.writeUInt8(pid, virtualAddress + i, data[i]);
    }
  }

  public malloc(pid: number, sizeBytes: number): number {
    if (sizeBytes <= 0) return 0;
    const alignedSize = (sizeBytes + 7) & ~7; // 8-byte alignment

    let current: MemoryBlock | null | undefined = this.memoryBlocks.get(pid);
    if (!current) {
      this.initializeProcessAddressSpace(pid);
      current = this.memoryBlocks.get(pid)!;
    }

    while (current) {
      if (current.isFree && current.size >= alignedSize) {
        // Split block if remaining space is substantial
        if (current.size >= alignedSize + 32) {
          const newBlock = new MemoryBlock(
            current.address + alignedSize,
            current.size - alignedSize,
            true
          );
          newBlock.next = current.next;
          newBlock.prev = current;
          if (current.next) {
            current.next.prev = newBlock;
          }
          current.next = newBlock;
          current.size = alignedSize;
        }
        current.isFree = false;

        // Ensure backing pages are allocated
        const startPage = Math.floor(current.address / VirtualMemoryManager.PAGE_SIZE);
        const endPage = Math.floor((current.address + current.size - 1) / VirtualMemoryManager.PAGE_SIZE);
        for (let p = startPage; p <= endPage; p++) {
          this.mapVirtualPage(pid, p, true, true);
        }

        return current.address;
      }
      current = current.next;
    }

    throw new Error(`ENOMEM: Cannot allocate ${sizeBytes} bytes on heap for PID ${pid}`);
  }

  public free(pid: number, address: number): void {
    let current: MemoryBlock | null | undefined = this.memoryBlocks.get(pid);
    while (current) {
      if (current.address === address) {
        current.isFree = true;

        // Coalesce with next block
        if (current.next && current.next.isFree) {
          current.size += current.next.size;
          current.next = current.next.next;
          if (current.next) {
            current.next.prev = current;
          }
        }

        // Coalesce with prev block
        if (current.prev && current.prev.isFree) {
          current.prev.size += current.size;
          current.prev.next = current.next;
          if (current.next) {
            current.next.prev = current.prev;
          }
        }
        return;
      }
      current = current.next;
    }
  }

  public getStats(): MemoryStats {
    let allocatedFrames = 0;
    for (let frame = 0; frame < VirtualMemoryManager.TOTAL_FRAMES; frame++) {
      const byteIdx = Math.floor(frame / 8);
      const bitIdx = frame % 8;
      if ((this.frameBitmap[byteIdx] & (1 << bitIdx)) !== 0) {
        allocatedFrames++;
      }
    }

    const freeFrames = VirtualMemoryManager.TOTAL_FRAMES - allocatedFrames;
    const usedBytes = allocatedFrames * VirtualMemoryManager.PAGE_SIZE;

    return {
      totalMemoryBytes: VirtualMemoryManager.TOTAL_SYSTEM_RAM,
      usedMemoryBytes: usedBytes,
      freeMemoryBytes: VirtualMemoryManager.TOTAL_SYSTEM_RAM - usedBytes,
      pageSize: VirtualMemoryManager.PAGE_SIZE,
      totalPages: VirtualMemoryManager.TOTAL_FRAMES,
      allocatedPages: allocatedFrames,
      freePages: freeFrames,
      pageFaultCount: this.pageFaults,
      swapUsageBytes: this.swapUsage,
    };
  }
}

export const virtualMemory = VirtualMemoryManager.getInstance();
