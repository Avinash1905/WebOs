/**
 * @file EventTelemetryDashboard.ts
 * @description Event bus metrics, percentile latency tracking, and throughput analysis.
 */

export class EventTelemetryDashboard {
  private readonly latencies: number[] = [];
  private eventCounts = new Map<string, number>();

  public recordEvent(eventType: string, latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) this.latencies.shift();

    const count = (this.eventCounts.get(eventType) ?? 0) + 1;
    this.eventCounts.set(eventType, count);
  }

  public getPercentileLatency(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    const val = sorted[idx];
    return val !== undefined ? val : 0;
  }

  public getTopEvents(limit = 5): readonly { eventType: string; count: number }[] {
    const list = Array.from(this.eventCounts.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);
    return list.slice(0, limit);
  }
}
