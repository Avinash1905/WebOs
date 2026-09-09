/**
 * WebOS Core - Kernel Slab Allocator
 * High-performance fixed-size object cache allocator for kernel objects (PCBs, Inodes, FileDescriptors).
 */

export interface SlabObject<T> {
  data: T;
  inUse: boolean;
  index: number;
}

export class SlabCache<T> {
  public readonly name: string;
  public readonly objectSize: number;
  public readonly objectsPerSlab: number;
  private factory: () => T;
  private slabs: Array<SlabObject<T>[]> = [];
  private totalAllocated: number = 0;
  private totalActive: number = 0;

  constructor(name: string, objectSize: number, objectsPerSlab: number, factory: () => T) {
    this.name = name;
    this.objectSize = objectSize;
    this.objectsPerSlab = objectsPerSlab;
    this.factory = factory;
    this.grow();
  }

  private grow(): void {
    const slab: SlabObject<T>[] = [];
    for (let i = 0; i < this.objectsPerSlab; i++) {
      slab.push({
        data: this.factory(),
        inUse: false,
        index: i,
      });
      this.totalAllocated++;
    }
    this.slabs.push(slab);
  }

  public allocate(): T {
    for (const slab of this.slabs) {
      for (const obj of slab) {
        if (!obj.inUse) {
          obj.inUse = true;
          this.totalActive++;
          return obj.data;
        }
      }
    }

    // All existing slabs full -> grow cache
    this.grow();
    const newestSlab = this.slabs[this.slabs.length - 1];
    newestSlab[0].inUse = true;
    this.totalActive++;
    return newestSlab[0].data;
  }

  public release(target: T): boolean {
    for (const slab of this.slabs) {
      for (const obj of slab) {
        if (obj.data === target && obj.inUse) {
          obj.inUse = false;
          this.totalActive--;
          return true;
        }
      }
    }
    return false;
  }

  public getStats() {
    return {
      name: this.name,
      objectSize: this.objectSize,
      totalSlabs: this.slabs.length,
      totalAllocated: this.totalAllocated,
      totalActive: this.totalActive,
      utilizationPercent: this.totalAllocated > 0 ? (this.totalActive / this.totalAllocated) * 100 : 0,
    };
  }
}

export class KernelMemoryManager {
  private static instance: KernelMemoryManager;
  private caches: Map<string, SlabCache<any>> = new Map();

  private constructor() {}

  public static getInstance(): KernelMemoryManager {
    if (!KernelMemoryManager.instance) {
      KernelMemoryManager.instance = new KernelMemoryManager();
    }
    return KernelMemoryManager.instance;
  }

  public createCache<T>(name: string, objectSize: number, objectsPerSlab: number, factory: () => T): SlabCache<T> {
    const cache = new SlabCache<T>(name, objectSize, objectsPerSlab, factory);
    this.caches.set(name, cache);
    return cache;
  }

  public getCache<T>(name: string): SlabCache<T> | undefined {
    return this.caches.get(name);
  }

  public getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

export const kernelMemory = KernelMemoryManager.getInstance();
