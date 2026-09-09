/**
 * @file ProcessProfilingEngine.ts
 * @description CPU cycle sampling, memory allocation profiler, and execution flame traces.
 */

export interface ProfileSample {
  readonly timestamp: number;
  readonly pid: number;
  readonly functionName: string;
  readonly executionTimeMs: number;
  readonly memoryAllocatedBytes: number;
}

export interface ProfileReport {
  readonly pid: number;
  readonly totalExecutionTimeMs: number;
  readonly totalMemoryAllocatedBytes: number;
  readonly sampleCount: number;
  readonly topFunctions: { functionName: string; totalMs: number; calls: number }[];
}

export class ProcessProfilingEngine {
  private readonly _samples = new Map<number, ProfileSample[]>();

  public recordSample(
    pid: number,
    functionName: string,
    executionTimeMs: number,
    memoryAllocatedBytes: number = 0
  ): void {
    let list = this._samples.get(pid);
    if (!list) {
      list = [];
      this._samples.set(pid, list);
    }
    list.push({
      timestamp: Date.now(),
      pid,
      functionName,
      executionTimeMs,
      memoryAllocatedBytes,
    });
  }

  public generateReport(pid: number): ProfileReport {
    const samples = this._samples.get(pid) ?? [];
    let totalMs = 0;
    let totalMem = 0;
    const funcMap = new Map<string, { totalMs: number; calls: number }>();

    for (const sample of samples) {
      totalMs += sample.executionTimeMs;
      totalMem += sample.memoryAllocatedBytes;

      const stats = funcMap.get(sample.functionName) ?? { totalMs: 0, calls: 0 };
      stats.totalMs += sample.executionTimeMs;
      stats.calls += 1;
      funcMap.set(sample.functionName, stats);
    }

    const topFunctions = Array.from(funcMap.entries())
      .map(([functionName, stats]) => ({ functionName, ...stats }))
      .sort((a, b) => b.totalMs - a.totalMs);

    return {
      pid,
      totalExecutionTimeMs: totalMs,
      totalMemoryAllocatedBytes: totalMem,
      sampleCount: samples.length,
      topFunctions,
    };
  }

  public clear(pid: number): void {
    this._samples.delete(pid);
  }
}
