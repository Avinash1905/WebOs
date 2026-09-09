/**
 * @file CrashDumpGenerator.ts
 * @description Core dump generation: process registers, memory heap snapshot and call trace.
 */

export interface CrashReport {
  readonly pid: number;
  readonly crashReason: string;
  readonly timestamp: number;
  readonly callStack: string;
  readonly memorySnapshot: { allocatedBytes: number; heapObjectsCount: number };
}

export class CrashDumpGenerator {
  public static generateReport(
    pid: number,
    error: Error | string,
    memorySnapshot?: { allocatedBytes: number; heapObjectsCount: number }
  ): CrashReport {
    const reason = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? new Error().stack || '' : error.stack || '';

    return {
      pid,
      crashReason: reason,
      timestamp: Date.now(),
      callStack: stack,
      memorySnapshot: memorySnapshot ?? { allocatedBytes: 0, heapObjectsCount: 0 },
    };
  }
}
