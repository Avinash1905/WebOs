/**
 * @file FairShareGroupScheduler.ts
 * @description Hierarchical token-bucket fair-share scheduler across multi-user groups.
 */

export interface ShareGroup {
  readonly groupId: string;
  readonly shares: number; // Proportion of CPU bandwidth
  tokens: number;
  readonly maxTokens: number;
}

export class FairShareGroupScheduler {
  private readonly _groups = new Map<string, ShareGroup>();
  private _totalShares = 0;

  public registerGroup(groupId: string, shares: number): void {
    const group: ShareGroup = {
      groupId,
      shares,
      tokens: shares * 100,
      maxTokens: shares * 200,
    };
    this._groups.set(groupId, group);
    this.recalculateTotalShares();
  }

  public replenishTokens(periodUnits: number = 1): void {
    for (const group of this._groups.values()) {
      const added = group.shares * 10 * periodUnits;
      group.tokens = Math.min(group.maxTokens, group.tokens + added);
    }
  }

  /**
   * Selects next group to execute based on available token balance.
   */
  public selectGroupForExecution(costTokens: number = 10): string | null {
    let bestGroupId: string | null = null;
    let highestRatio = -Infinity;

    for (const group of this._groups.values()) {
      if (group.tokens >= costTokens) {
        const ratio = group.tokens / group.shares;
        if (ratio > highestRatio) {
          highestRatio = ratio;
          bestGroupId = group.groupId;
        }
      }
    }

    if (bestGroupId) {
      const group = this._groups.get(bestGroupId)!;
      group.tokens -= costTokens;
    }

    return bestGroupId;
  }

  private recalculateTotalShares(): void {
    this._totalShares = 0;
    for (const group of this._groups.values()) {
      this._totalShares += group.shares;
    }
  }

  public getGroup(groupId: string): ShareGroup | undefined {
    return this._groups.get(groupId);
  }
}
