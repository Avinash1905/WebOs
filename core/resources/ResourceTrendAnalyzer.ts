/**
 * @file ResourceTrendAnalyzer.ts
 * @description Resource consumption trend forecasting and exhaustion slope detection.
 */

export interface MetricSample {
  readonly timestamp: number;
  readonly value: number;
}

export class ResourceTrendAnalyzer {
  private readonly samples: MetricSample[] = [];

  constructor(private readonly maxSamples = 60) {}

  public recordSample(value: number): void {
    this.samples.push({ timestamp: Date.now(), value });
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  public calculateSlope(): number {
    if (this.samples.length < 2) return 0;

    const n = this.samples.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const sample = this.samples[i];
      if (!sample) continue;
      const x = i;
      const y = sample.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  public predictNext(stepsAhead = 1): number {
    if (this.samples.length === 0) return 0;
    const lastSample = this.samples[this.samples.length - 1];
    const lastVal = lastSample ? lastSample.value : 0;
    const slope = this.calculateSlope();
    return Math.max(0, lastVal + slope * stepsAhead);
  }
}
