/**
 * @file KernelTracing.ts
 * @description Distributed execution tracing and span tracking for asynchronous Kernel operations.
 */

export interface TraceSpan {
  readonly id: string;
  readonly parentId?: string;
  readonly name: string;
  readonly serviceName?: string;
  readonly startTime: number;
  endTime?: number;
  durationMs?: number;
  readonly tags: Record<string, string | number | boolean>;
  readonly logs: { timestamp: number; message: string; details?: unknown }[];
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

let spanCounter = 0;

export class KernelTracing {
  private readonly _spans = new Map<string, TraceSpan>();
  private readonly _maxSpans: number;

  constructor(maxSpans = 500) {
    this._maxSpans = maxSpans;
  }

  public startSpan(name: string, parentId?: string, serviceName?: string, tags?: Record<string, string | number | boolean>): TraceSpan {
    const id = `span_${Date.now()}_${++spanCounter}_${Math.random().toString(36).slice(2, 6)}`;
    const span: TraceSpan = {
      id,
      parentId,
      name,
      serviceName,
      startTime: performance.now(),
      tags: { ...(tags ?? {}) },
      logs: [],
      status: 'RUNNING',
    };

    this._spans.set(id, span);
    this._enforceLimit();
    return span;
  }

  public endSpan(spanId: string, status: 'COMPLETED' | 'FAILED' = 'COMPLETED', error?: Error | string): TraceSpan | undefined {
    const span = this._spans.get(spanId);
    if (!span) return undefined;

    span.endTime = performance.now();
    span.durationMs = Number((span.endTime - span.startTime).toFixed(2));
    span.status = status;
    if (error) {
      span.error = typeof error === 'string' ? error : error.message;
    }

    return span;
  }

  public addLog(spanId: string, message: string, details?: unknown): void {
    const span = this._spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        details,
      });
    }
  }

  public getSpan(spanId: string): TraceSpan | undefined {
    return this._spans.get(spanId);
  }

  public getSpansByService(serviceName: string): TraceSpan[] {
    return Array.from(this._spans.values()).filter((s) => s.serviceName === serviceName);
  }

  public getRootSpans(): TraceSpan[] {
    return Array.from(this._spans.values()).filter((s) => !s.parentId);
  }

  public clear(): void {
    this._spans.clear();
  }

  public count(): number {
    return this._spans.size;
  }

  private _enforceLimit(): void {
    if (this._spans.size > this._maxSpans) {
      const keys = Array.from(this._spans.keys());
      const toRemove = keys.slice(0, this._spans.size - this._maxSpans);
      for (const k of toRemove) {
        this._spans.delete(k);
      }
    }
  }
}
