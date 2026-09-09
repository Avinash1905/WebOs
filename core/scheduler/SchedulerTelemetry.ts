/**
 * @file SchedulerTelemetry.ts
 * @description Real-time scheduler performance metrics and utilization analysis.
 */

export interface TelemetrySnapshot {
  readonly timestamp: number;
  readonly cpuUtilizationPercent: number;
  readonly contextSwitches: number;
  readonly activeTasksCount: number;
  readonly averageWaitTimeMs: number;
  readonly throughputTasksPerSec: number;
}

export class SchedulerTelemetry {
  private contextSwitches = 0;
  private totalWaitTimeMs = 0;
  private completedTasks = 0;
  private activeTimeMs = 0;
  private idleTimeMs = 0;

  public recordContextSwitch(): void {
    this.contextSwitches++;
  }

  public recordTaskCompletion(waitTimeMs: number): void {
    this.completedTasks++;
    this.totalWaitTimeMs += waitTimeMs;
  }

  public recordCpuActivity(busyMs: number, idleMs: number): void {
    this.activeTimeMs += busyMs;
    this.idleTimeMs += idleMs;
  }

  public getSnapshot(activeTasksCount = 0): TelemetrySnapshot {
    const totalTime = this.activeTimeMs + this.idleTimeMs;
    const cpuUtil = totalTime > 0 ? (this.activeTimeMs / totalTime) * 100 : 0;
    const avgWait = this.completedTasks > 0 ? this.totalWaitTimeMs / this.completedTasks : 0;

    return {
      timestamp: Date.now(),
      cpuUtilizationPercent: Math.round(cpuUtil * 10) / 10,
      contextSwitches: this.contextSwitches,
      activeTasksCount,
      averageWaitTimeMs: Math.round(avgWait * 10) / 10,
      throughputTasksPerSec: this.completedTasks
    };
  }

  public reset(): void {
    this.contextSwitches = 0;
    this.totalWaitTimeMs = 0;
    this.completedTasks = 0;
    this.activeTimeMs = 0;
    this.idleTimeMs = 0;
  }
}
