/**
 * @file TrashRetentionEngine.ts
 * @description Retention policy manager with TTL expiry and size-based quota auto-pruning.
 */

import type { TrashEntry } from './types.js';
import type { TrashManager } from './TrashManager.js';

export interface RetentionPolicy {
  readonly defaultTTLMs: number; // e.g. 30 days
  readonly maxTrashSizeBytes: number;
  readonly maxItemCount: number;
  readonly autoPrune: boolean;
}

export interface RetentionPruneResult {
  readonly totalEvaluated: number;
  readonly itemsDeleted: number;
  readonly bytesFreed: number;
  readonly remainingItems: number;
  readonly remainingBytes: number;
}

export class TrashRetentionEngine {
  private policy: RetentionPolicy;

  constructor(
    private readonly trashManager: TrashManager,
    policy?: Partial<RetentionPolicy>
  ) {
    this.policy = {
      defaultTTLMs: policy?.defaultTTLMs ?? 30 * 24 * 60 * 60 * 1000, // 30 days
      maxTrashSizeBytes: policy?.maxTrashSizeBytes ?? 100 * 1024 * 1024, // 100 MB
      maxItemCount: policy?.maxItemCount ?? 5000,
      autoPrune: policy?.autoPrune ?? true
    };
  }

  public getPolicy(): Readonly<RetentionPolicy> {
    return this.policy;
  }

  public setPolicy(updates: Partial<RetentionPolicy>): void {
    this.policy = { ...this.policy, ...updates };
  }

  public async evaluateExpired(): Promise<TrashEntry[]> {
    const items = await this.trashManager.listTrash();
    const now = Date.now();
    return items.filter(item => {
      const age = now - item.deletedAt;
      return age > this.policy.defaultTTLMs;
    });
  }

  public async prune(): Promise<RetentionPruneResult> {
    const items = await this.trashManager.listTrash();
    const now = Date.now();
    let bytesFreed = 0;
    let itemsDeleted = 0;

    // 1. Prune expired by TTL
    const sorted = [...items].sort((a, b) => a.deletedAt - b.deletedAt); // oldest first
    const toDeleteIds = new Set<string>();

    for (const item of sorted) {
      if (now - item.deletedAt > this.policy.defaultTTLMs) {
        toDeleteIds.add(item.trashId);
        bytesFreed += item.size;
        itemsDeleted++;
      }
    }

    // 2. Prune by item count quota
    const remainingAfterTTL = sorted.filter(i => !toDeleteIds.has(i.trashId));
    let currentCount = remainingAfterTTL.length;
    let currentBytes = remainingAfterTTL.reduce((acc, i) => acc + i.size, 0);

    for (const item of remainingAfterTTL) {
      if (currentCount > this.policy.maxItemCount || currentBytes > this.policy.maxTrashSizeBytes) {
        toDeleteIds.add(item.trashId);
        bytesFreed += item.size;
        itemsDeleted++;
        currentCount--;
        currentBytes -= item.size;
      }
    }

    for (const trashId of toDeleteIds) {
      await this.trashManager.purgeTrash(trashId);
    }

    const remainingStats = await this.trashManager.getTrashStats();

    return {
      totalEvaluated: items.length,
      itemsDeleted,
      bytesFreed,
      remainingItems: remainingStats.totalItems,
      remainingBytes: remainingStats.totalBytes
    };
  }
}
