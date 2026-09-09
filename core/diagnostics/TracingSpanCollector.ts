/**
 * @file TracingSpanCollector.ts
 * @description OpenTelemetry-aligned distributed trace span collector and parent-child trace context.
 */

export interface TraceSpan {
  readonly spanId: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  readonly attributes: Record<string, string | number>;
}

export class TracingSpanCollector {
  private readonly _spans = new Map<string, TraceSpan>();

  public startSpan(traceId: string, name: string, parentSpanId?: string): TraceSpan {
    const spanId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const span: TraceSpan = {
      spanId,
      traceId,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: {},
    };
    this._spans.set(spanId, span);
    return span;
  }

  public endSpan(spanId: string): void {
    const span = this._spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
    }
  }

  public getTraceSpans(traceId: string): TraceSpan[] {
    return Array.from(this._spans.values()).filter((s) => s.traceId === traceId);
  }
}
