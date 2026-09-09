/**
 * @file ResourcePressureNotifier.ts
 * @description Linux-style Pressure Stall Information (PSI) for CPU, Memory, and IO pressure.
 */

export interface PressureMetrics {
  cpuSome10: number; // percentage stall in last 10s
  memorySome10: number;
  ioSome10: number;
}

export class ResourcePressureNotifier {
  private _metrics: PressureMetrics = { cpuSome10: 0, memorySome10: 0, ioSome10: 0 };
  private readonly _subscribers: ((metrics: PressureMetrics) => void)[] = [];

  public updateMetrics(metrics: Partial<PressureMetrics>): void {
    this._metrics = { ...this._metrics, ...metrics };
    for (const sub of this._subscribers) {
      try {
        sub(this._metrics);
      } catch {
        // Ignore error
      }
    }
  }

  public onPressure(subscriber: (metrics: PressureMetrics) => void): () => void {
    this._subscribers.push(subscriber);
    return () => {
      const idx = this._subscribers.indexOf(subscriber);
      if (idx !== -1) this._subscribers.splice(idx, 1);
    };
  }

  public get metrics(): PressureMetrics {
    return { ...this._metrics };
  }
}
