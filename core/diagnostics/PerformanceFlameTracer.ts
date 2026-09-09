/**
 * @file PerformanceFlameTracer.ts
 * @description Continuous execution profiler and folded stack frame aggregator for FlameGraphs.
 */

export class PerformanceFlameTracer {
  private readonly _foldedFrames = new Map<string, number>(); // stack;path;func -> samplesCount

  public recordStack(stackFrames: readonly string[], samples: number = 1): void {
    const key = stackFrames.join(';');
    const current = this._foldedFrames.get(key) ?? 0;
    this._foldedFrames.set(key, current + samples);
  }

  public exportFoldedFormat(): string {
    const lines: string[] = [];
    for (const [stack, count] of this._foldedFrames.entries()) {
      lines.push(`${stack} ${count}`);
    }
    return lines.join('\n');
  }

  public clear(): void {
    this._foldedFrames.clear();
  }
}
