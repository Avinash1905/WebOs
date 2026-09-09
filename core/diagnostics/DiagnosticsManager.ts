/**
 * @file DiagnosticsManager.ts
 * @description Central System Diagnostics Service for WebOS.
 */

import { BaseSystemService } from '../kernel/index.js';
import { DIAGNOSTICS_EVENTS } from './DiagnosticsEvents.js';
import { CheckNotFoundError } from './DiagnosticsError.js';
import { ErrorTracker } from './ErrorTracker.js';
import { HealthChecker } from './HealthChecker.js';
import { RecoveryAdvisor } from './RecoveryAdvisor.js';
import type {
  DiagnosticCheck,
  DiagnosticReport,
  DiagnosticResult,
  DiagnosticsConfig,
  DiagnosticsDependencies,
  DiagnosticSeverity,
  SystemOverallHealth,
  TrackedError,
} from './types.js';

let reportCounter = 0;

export class DiagnosticsManager extends BaseSystemService {
  public override readonly name = 'diagnostics';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'storage',
    'filesystem',
    'process-manager',
    'users',
    'permissions',
    'services',
    'resource-manager',
  ];

  private readonly _checks = new Map<string, DiagnosticCheck>();
  private readonly _errorTracker: ErrorTracker;
  private readonly _reportHistory: DiagnosticReport[] = [];
  private readonly _maxReports: number;
  private readonly _deps: DiagnosticsDependencies;

  constructor(
    deps: DiagnosticsDependencies = {},
    config?: DiagnosticsConfig
  ) {
    super();
    this._deps = deps;
    this._errorTracker = new ErrorTracker(config?.maxErrorHistory ?? 100);
    this._maxReports = config?.maxReportHistory ?? 20;

    this._registerDefaultChecks();
  }

  public registerCheck(check: DiagnosticCheck): void {
    this._checks.set(check.id, check);
  }

  public unregisterCheck(checkId: string): boolean {
    return this._checks.delete(checkId);
  }

  public hasCheck(checkId: string): boolean {
    return this._checks.has(checkId);
  }

  public getCheck(checkId: string): DiagnosticCheck | undefined {
    return this._checks.get(checkId);
  }

  public getChecks(): DiagnosticCheck[] {
    return Array.from(this._checks.values());
  }

  public async runCheck(checkId: string): Promise<DiagnosticResult> {
    const check = this._checks.get(checkId);
    if (!check) {
      throw new CheckNotFoundError(checkId);
    }

    try {
      return await check.run();
    } catch (err: any) {
      this.recordError('diagnostics', err, 'HIGH', { checkId });
      return {
        checkId,
        name: check.name,
        category: check.category,
        severity: check.severity,
        status: 'FAIL',
        timestamp: Date.now(),
        message: `Diagnostic check thrown error: ${err.message ?? String(err)}`,
        recommendation: 'Check system service logs and dependencies.',
      };
    }
  }

  public async runAllChecks(): Promise<DiagnosticReport> {
    const startTime = performance.now();
    this._emitEvent(DIAGNOSTICS_EVENTS.STARTED, { timestamp: Date.now() });

    const results: DiagnosticResult[] = [];
    let passedCount = 0;
    let warningCount = 0;
    let failCount = 0;
    let unknownCount = 0;

    for (const check of this._checks.values()) {
      const result = await this.runCheck(check.id);
      results.push(result);

      if (result.status === 'PASS') passedCount++;
      else if (result.status === 'WARNING') warningCount++;
      else if (result.status === 'FAIL') failCount++;
      else if (result.status === 'UNKNOWN') unknownCount++;
    }

    let overallHealth: SystemOverallHealth = 'HEALTHY';
    if (failCount > 0) {
      overallHealth = 'UNHEALTHY';
    } else if (warningCount > 0) {
      overallHealth = 'DEGRADED';
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));
    const reportId = `diag_rep_${Date.now()}_${++reportCounter}`;

    const summary = `Diagnostics Run: ${overallHealth} (${passedCount} passed, ${warningCount} warnings, ${failCount} failed, ${unknownCount} unknown in ${durationMs}ms)`;

    const report: DiagnosticReport = {
      reportId,
      timestamp: Date.now(),
      durationMs,
      overallHealth,
      totalChecks: results.length,
      passedCount,
      warningCount,
      failCount,
      unknownCount,
      results,
      summary,
    };

    this._reportHistory.unshift(report);
    if (this._reportHistory.length > this._maxReports) {
      this._reportHistory.length = this._maxReports;
    }

    this._emitEvent(DIAGNOSTICS_EVENTS.COMPLETED, {
      reportId,
      overallHealth,
      durationMs,
      timestamp: report.timestamp,
    });

    if (failCount > 0) {
      this._emitEvent(DIAGNOSTICS_EVENTS.CRITICAL, { reportId, failCount });
    } else if (warningCount > 0) {
      this._emitEvent(DIAGNOSTICS_EVENTS.WARNING, { reportId, warningCount });
    }

    return report;
  }

  public getLastReport(): DiagnosticReport | null {
    return this._reportHistory[0] ?? null;
  }

  public getReportHistory(): readonly DiagnosticReport[] {
    return Object.freeze([...this._reportHistory]);
  }

  public clearReports(): void {
    this._reportHistory.length = 0;
  }

  public recordError(
    subsystem: string,
    error: Error | string,
    severity: DiagnosticSeverity = 'MEDIUM',
    context?: Record<string, unknown>
  ): TrackedError {
    const item = this._errorTracker.record(subsystem, error, severity, context);
    this._emitEvent(DIAGNOSTICS_EVENTS.ERROR_RECORDED, {
      errorId: item.id,
      subsystem,
      severity,
      message: item.message,
      timestamp: item.timestamp,
    });
    return item;
  }

  public getErrorCount(): number {
    return this._errorTracker.count();
  }

  public getErrors(filter?: { subsystem?: string; severity?: DiagnosticSeverity }): readonly TrackedError[] {
    return this._errorTracker.getErrors(filter);
  }

  public clearErrors(): void {
    this._errorTracker.clear();
  }

  public getRecoveryAdvice(): string[] {
    const lastReport = this.getLastReport();
    if (!lastReport) return [];
    return RecoveryAdvisor.getRecommendations(lastReport.results);
  }

  protected override async onStart(): Promise<void> {
    // Diagnostics service active
  }

  protected override async onStop(): Promise<void> {
    this.clearReports();
  }

  private _registerDefaultChecks(): void {
    const defaults = HealthChecker.createDefaultChecks(this._deps);
    for (const c of defaults) {
      this.registerCheck(c);
    }
  }

  private _emitEvent(event: string, payload: Record<string, unknown>): void {
    if (this._deps.eventBus) {
      this._deps.eventBus.emit(event as any, payload as any);
    }
  }
}
