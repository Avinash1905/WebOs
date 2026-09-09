/**
 * WebOS Backend - Real-time Analytics & Telemetry Pipeline
 */

export interface MetricDataPoint {
  metric: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface CrashReport {
  id: string;
  appId: string;
  errorMessage: string;
  stackTrace: string;
  timestamp: number;
  userId?: string;
  deviceInfo: {
    browser: string;
    os: string;
    screenResolution: string;
    memoryHeapMb: number;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private timeSeriesData: MetricDataPoint[] = [];
  private crashReports: CrashReport[] = [];

  private constructor() {
    this.seedInitialMetrics();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private seedInitialMetrics(): void {
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      this.timeSeriesData.push({
        metric: 'cpu.usage_percent',
        value: Math.floor(Math.random() * 25) + 5,
        timestamp: now - i * 5000,
      });
      this.timeSeriesData.push({
        metric: 'memory.heap_mb',
        value: 120 + Math.floor(Math.random() * 30),
        timestamp: now - i * 5000,
      });
    }
  }

  public recordMetric(metric: string, value: number, tags?: Record<string, string>): void {
    this.timeSeriesData.push({
      metric,
      value,
      timestamp: Date.now(),
      tags,
    });

    // Retain sliding window of 10,000 points
    if (this.timeSeriesData.length > 10000) {
      this.timeSeriesData = this.timeSeriesData.slice(-5000);
    }
  }

  public reportCrash(report: Omit<CrashReport, 'id' | 'timestamp'>): CrashReport {
    const fullReport: CrashReport = {
      ...report,
      id: `crash-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    this.crashReports.push(fullReport);
    return fullReport;
  }

  public getMetrics(metricName: string, fromTimestamp?: number): MetricDataPoint[] {
    let result = this.timeSeriesData.filter((d) => d.metric === metricName);
    if (fromTimestamp) {
      result = result.filter((d) => d.timestamp >= fromTimestamp);
    }
    return result;
  }

  public getCrashReports(): CrashReport[] {
    return this.crashReports;
  }
}

export const analyticsService = AnalyticsService.getInstance();
