import { describe, expect, it } from 'vitest';
import { TracingSpanCollector } from '../../core/diagnostics/index.js';

describe('Distributed Tracing Span Collector', () => {
  it('TracingSpanCollector tracks spans, parent-child hierarchies and trace context', () => {
    const collector = new TracingSpanCollector();
    const traceId = 'trace_999';

    const rootSpan = collector.startSpan(traceId, 'KernelBoot');
    const childSpan = collector.startSpan(traceId, 'InitVFS', rootSpan.spanId);

    collector.endSpan(childSpan.spanId);
    collector.endSpan(rootSpan.spanId);

    const spans = collector.getTraceSpans(traceId);
    expect(spans.length).toBe(2);
    expect(spans[1]!.parentSpanId).toBe(rootSpan.spanId);
    expect(spans[0]!.endTime).toBeDefined();
  });
});
