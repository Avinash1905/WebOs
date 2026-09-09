/**
 * WebOS Core - POSIX Cron Scheduler Daemon (crond)
 */

import { CronJob } from './types';

export class CronScheduler {
  private static instance: CronScheduler;
  private jobs: Map<string, CronJob> = new Map();

  private constructor() {
    this.initializeDefaultJobs();
    this.startSchedulerLoop();
  }

  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  private initializeDefaultJobs(): void {
    this.addJob({
      id: 'cron-vfs-snapshot',
      name: 'VFS Hourly Snapshot',
      expression: '0 * * * *',
      command: 'vfs backup --output /var/backups/hourly.tar.gz',
      enabled: true,
      executionCount: 14,
      lastRunTimestamp: Date.now() - 1800000,
    });

    this.addJob({
      id: 'cron-log-rotate',
      name: 'Daily System Log Rotate',
      expression: '0 0 * * *',
      command: 'logrotate /etc/logrotate.conf',
      enabled: true,
      executionCount: 3,
      lastRunTimestamp: Date.now() - 3600000 * 12,
    });

    this.addJob({
      id: 'cron-entropy-reseed',
      name: 'Reseed System Entropy Pool',
      expression: '*/15 * * * *',
      command: 'sysctl kernel.random.reseed',
      enabled: true,
      executionCount: 56,
      lastRunTimestamp: Date.now() - 600000,
    });
  }

  private startSchedulerLoop(): void {
    setInterval(() => {
      const now = Date.now();
      for (const job of this.jobs.values()) {
        if (!job.enabled) continue;
        // In full daemon, matches 5-field cron pattern against current minute
        if (!job.lastRunTimestamp || now - job.lastRunTimestamp > 60000) {
          job.lastRunTimestamp = now;
          job.executionCount++;
        }
      }
    }, 60000);
  }

  public addJob(job: CronJob): void {
    this.jobs.set(job.id, job);
  }

  public removeJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  public toggleJob(id: string, enabled: boolean): boolean {
    const j = this.jobs.get(id);
    if (!j) return false;
    j.enabled = enabled;
    return true;
  }

  public listJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }
}

export const cronScheduler = CronScheduler.getInstance();
