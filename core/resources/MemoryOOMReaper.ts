/**
 * @file MemoryOOMReaper.ts
 * @description Out-Of-Memory (OOM) score calculation and victim process selection.
 */

export interface ProcessMemoryScore {
  readonly pid: number;
  readonly memoryUsedMB: number;
  readonly oomScoreAdj: number; // -1000 (never kill) to 1000 (kill first)
}

export class MemoryOOMReaper {
  public static calculateVictim(processes: readonly ProcessMemoryScore[]): ProcessMemoryScore | null {
    let worstScore = -Infinity;
    let victim: ProcessMemoryScore | null = null;

    for (const p of processes) {
      if (p.oomScoreAdj <= -1000) continue; // Protected

      const score = p.memoryUsedMB + p.oomScoreAdj * 10;
      if (score > worstScore) {
        worstScore = score;
        victim = p;
      }
    }

    return victim;
  }
}
