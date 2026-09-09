/**
 * @file ResourceReclaimer.ts
 * @description Prioritized tiered resource reclamation under low-memory pressure.
 */

export type ReclaimCallback = () => Promise<number> | number;

export class ResourceReclaimer {
  private readonly tier1Callbacks: ReclaimCallback[] = []; // Invalidate caches
  private readonly tier2Callbacks: ReclaimCallback[] = []; // Prune old trash
  private readonly tier3Callbacks: ReclaimCallback[] = []; // Suspend background apps

  public registerTier1(cb: ReclaimCallback): void {
    this.tier1Callbacks.push(cb);
  }

  public registerTier2(cb: ReclaimCallback): void {
    this.tier2Callbacks.push(cb);
  }

  public registerTier3(cb: ReclaimCallback): void {
    this.tier3Callbacks.push(cb);
  }

  public async reclaim(targetBytes: number): Promise<{ bytesFreed: number; tierReached: number }> {
    let freed = 0;

    // Run Tier 1
    for (const cb of this.tier1Callbacks) {
      freed += await Promise.resolve(cb());
      if (freed >= targetBytes) return { bytesFreed: freed, tierReached: 1 };
    }

    // Run Tier 2
    for (const cb of this.tier2Callbacks) {
      freed += await Promise.resolve(cb());
      if (freed >= targetBytes) return { bytesFreed: freed, tierReached: 2 };
    }

    // Run Tier 3
    for (const cb of this.tier3Callbacks) {
      freed += await Promise.resolve(cb());
      if (freed >= targetBytes) return { bytesFreed: freed, tierReached: 3 };
    }

    return { bytesFreed: freed, tierReached: 3 };
  }
}
