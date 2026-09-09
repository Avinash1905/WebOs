/**
 * @file KernelPanicHandler.ts
 * @description Catastrophic error containment, crash dump generation, and emergency fallback.
 */

export interface CrashDump {
  readonly id: string;
  readonly timestamp: number;
  readonly reason: string;
  readonly sourceService?: string;
  readonly stackTrace?: string;
  readonly kernelState: string;
  readonly runningServices: string[];
  readonly systemUptimeMs: number;
  readonly metadata?: Record<string, unknown>;
}

let panicIdCounter = 0;

export class KernelPanicHandler {
  private readonly _crashDumps: CrashDump[] = [];
  private readonly _maxDumps: number;
  private _panicCount = 0;
  private _isDegradedMode = false;

  constructor(maxDumps = 10) {
    this._maxDumps = maxDumps;
  }

  public triggerPanic(
    reason: string,
    context: {
      sourceService?: string;
      error?: Error;
      kernelState: string;
      runningServices: string[];
      uptimeMs: number;
      metadata?: Record<string, unknown>;
    }
  ): CrashDump {
    this._panicCount++;
    this._isDegradedMode = true;

    const dump: CrashDump = {
      id: `panic_${Date.now()}_${++panicIdCounter}`,
      timestamp: Date.now(),
      reason,
      sourceService: context.sourceService,
      stackTrace: context.error?.stack,
      kernelState: context.kernelState,
      runningServices: [...context.runningServices],
      systemUptimeMs: context.uptimeMs,
      metadata: context.metadata ? { ...context.metadata } : undefined,
    };

    this._crashDumps.unshift(dump);
    if (this._crashDumps.length > this._maxDumps) {
      this._crashDumps.length = this._maxDumps;
    }

    return dump;
  }

  public isDegraded(): boolean {
    return this._isDegradedMode;
  }

  public resetDegradedState(): void {
    this._isDegradedMode = false;
  }

  public getPanicCount(): number {
    return this._panicCount;
  }

  public getLatestCrashDump(): CrashDump | undefined {
    return this._crashDumps[0];
  }

  public getAllCrashDumps(): readonly CrashDump[] {
    return Object.freeze([...this._crashDumps]);
  }

  public clearDumps(): void {
    this._crashDumps.length = 0;
  }
}
