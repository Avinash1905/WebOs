/**
 * @file ProcessMemoryTracker.ts
 * @description Virtual memory allocation tracking and OOM badness calculation.
 */

export interface ProcessMemoryUsage {
  readonly pid: number;
  readonly heapBytes: number;
  readonly stackBytes: number;
  readonly totalBytes: number;
  readonly maxLimitBytes: number;
  readonly allocationsCount: number;
}

export class ProcessMemoryTracker {
  private readonly usage = new Map<number, { heap: number; stack: number; limit: number; count: number }>();

  public trackProcess(pid: number, maxLimitBytes = 64 * 1024 * 1024): void {
    this.usage.set(pid, { heap: 0, stack: 4096, limit: maxLimitBytes, count: 0 });
  }

  public allocate(pid: number, bytes: number): boolean {
    const mem = this.usage.get(pid);
    if (!mem) return false;

    if (mem.heap + mem.stack + bytes > mem.limit) {
      return false; // Out of virtual memory limit
    }

    mem.heap += bytes;
    mem.count++;
    return true;
  }

  public free(pid: number, bytes: number): void {
    const mem = this.usage.get(pid);
    if (!mem) return;
    mem.heap = Math.max(0, mem.heap - bytes);
  }

  public getUsage(pid: number): ProcessMemoryUsage | undefined {
    const mem = this.usage.get(pid);
    if (!mem) return undefined;
    return {
      pid,
      heapBytes: mem.heap,
      stackBytes: mem.stack,
      totalBytes: mem.heap + mem.stack,
      maxLimitBytes: mem.limit,
      allocationsCount: mem.count
    };
  }

  public calculateOOMScore(pid: number): number {
    const mem = this.usage.get(pid);
    if (!mem || mem.limit === 0) return 0;
    const ratio = (mem.heap + mem.stack) / mem.limit;
    return Math.min(1000, Math.floor(ratio * 1000));
  }

  public untrackProcess(pid: number): void {
    this.usage.delete(pid);
  }
}
