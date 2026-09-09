/**
 * @file DiagnosticRuleEngine.ts
 * @description Anomaly detection rules evaluating system metrics against operational thresholds.
 */

export interface DiagnosticTelemetryContext {
  readonly memoryUsagePercent: number;
  readonly runningProcessesCount: number;
  readonly droppedEventsCount: number;
  readonly storageUsagePercent: number;
}

export interface DiagnosticAlert {
  readonly ruleId: string;
  readonly severity: 'INFO' | 'WARNING' | 'CRITICAL';
  readonly message: string;
  readonly suggestedAction: string;
}

export class DiagnosticRuleEngine {
  public evaluate(ctx: DiagnosticTelemetryContext): readonly DiagnosticAlert[] {
    const alerts: DiagnosticAlert[] = [];

    if (ctx.memoryUsagePercent > 90) {
      alerts.push({
        ruleId: 'HIGH_MEMORY_PRESSURE',
        severity: 'CRITICAL',
        message: `Memory usage is critical: ${ctx.memoryUsagePercent}%`,
        suggestedAction: 'Trigger ResourceReclaimer to free caches and prune trash'
      });
    } else if (ctx.memoryUsagePercent > 75) {
      alerts.push({
        ruleId: 'ELEVATED_MEMORY',
        severity: 'WARNING',
        message: `Memory usage elevated: ${ctx.memoryUsagePercent}%`,
        suggestedAction: 'Monitor memory trend for potential leak'
      });
    }

    if (ctx.droppedEventsCount > 0) {
      alerts.push({
        ruleId: 'EVENT_BUS_DROPS',
        severity: 'WARNING',
        message: `EventBus has dropped ${ctx.droppedEventsCount} events`,
        suggestedAction: 'Inspect DeadLetterQueue or throttle event dispatch rate'
      });
    }

    if (ctx.storageUsagePercent > 85) {
      alerts.push({
        ruleId: 'STORAGE_PRESSURE',
        severity: 'WARNING',
        message: `Storage quota near limit: ${ctx.storageUsagePercent}%`,
        suggestedAction: 'Empty trash or purge application cache'
      });
    }

    return Object.freeze(alerts);
  }
}
