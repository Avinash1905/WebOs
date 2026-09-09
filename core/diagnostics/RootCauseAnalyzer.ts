/**
 * @file RootCauseAnalyzer.ts
 * @description Correlates errors, crash traces, and telemetry to isolate root cause failures.
 */

export interface CrashEventLog {
  readonly timestamp: number;
  readonly component: string;
  readonly error: string;
  readonly stack?: string;
}

export class RootCauseAnalyzer {
  public static analyze(logs: readonly CrashEventLog[]): { primaryCulprit: string; confidence: number; summary: string } {
    if (logs.length === 0) {
      return { primaryCulprit: 'NONE', confidence: 1.0, summary: 'No crash events logged' };
    }

    const componentCounts = new Map<string, number>();
    for (const log of logs) {
      const count = (componentCounts.get(log.component) ?? 0) + 1;
      componentCounts.set(log.component, count);
    }

    let maxComponent = 'UNKNOWN';
    let maxCount = 0;

    for (const [comp, count] of componentCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxComponent = comp;
      }
    }

    const confidence = Math.min(0.95, maxCount / logs.length);
    return {
      primaryCulprit: maxComponent,
      confidence: Math.round(confidence * 100) / 100,
      summary: `Component ${maxComponent} accounts for ${maxCount} of ${logs.length} logged crashes`
    };
  }
}
