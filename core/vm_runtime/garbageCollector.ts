/**
 * WebOS Generational Mark-Sweep-Compact Garbage Collector
 */

export interface HeapObject {
  id: number;
  sizeBytes: number;
  generation: 'nursery' | 'survivor' | 'tenured';
  survivedCycles: number;
  marked: boolean;
  references: number[];
}

export class GarbageCollector {
  private heap: Map<number, HeapObject> = new Map();
  private nextObjectId = 1;
  private rootSet: Set<number> = new Set();
  private gcCycleCount = 0;
  private totalBytesFreed = 0;

  public allocate(sizeBytes: number, references: number[] = []): number {
    const id = this.nextObjectId++;
    const obj: HeapObject = {
      id,
      sizeBytes,
      generation: 'nursery',
      survivedCycles: 0,
      marked: false,
      references,
    };
    this.heap.set(id, obj);
    return id;
  }

  public addRoot(id: number): void {
    this.rootSet.add(id);
  }

  public removeRoot(id: number): void {
    this.rootSet.delete(id);
  }

  public collectMinor(): number {
    this.gcCycleCount++;
    let freed = 0;

    // Mark reachable from roots
    const reachable = new Set<number>();
    for (const rootId of this.rootSet) {
      this.traverse(rootId, reachable);
    }

    // Sweep nursery
    for (const [id, obj] of this.heap.entries()) {
      if (obj.generation === 'nursery') {
        if (!reachable.has(id)) {
          freed += obj.sizeBytes;
          this.heap.delete(id);
        } else {
          obj.survivedCycles++;
          if (obj.survivedCycles > 2) {
            obj.generation = 'tenured';
          } else {
            obj.generation = 'survivor';
          }
        }
      }
    }

    this.totalBytesFreed += freed;
    return freed;
  }

  public collectMajor(): number {
    this.gcCycleCount++;
    let freed = 0;

    const reachable = new Set<number>();
    for (const rootId of this.rootSet) {
      this.traverse(rootId, reachable);
    }

    for (const [id, obj] of this.heap.entries()) {
      if (!reachable.has(id)) {
        freed += obj.sizeBytes;
        this.heap.delete(id);
      }
    }

    this.totalBytesFreed += freed;
    return freed;
  }

  private traverse(id: number, visited: Set<number>): void {
    if (visited.has(id)) return;
    visited.add(id);
    const obj = this.heap.get(id);
    if (obj) {
      for (const ref of obj.references) {
        this.traverse(ref, visited);
      }
    }
  }

  public getStats() {
    return {
      heapObjects: this.heap.size,
      totalBytesFreed: this.totalBytesFreed,
      gcCycles: this.gcCycleCount,
    };
  }
}

export const garbageCollector = new GarbageCollector();
