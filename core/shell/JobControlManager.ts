/**
 * @file JobControlManager.ts
 * @description POSIX job control: background/foreground jobs, SIGTSTP, fg, bg state tracking.
 */

export type JobControlStatus = 'RUNNING' | 'STOPPED' | 'TERMINATED';

export interface JobControlItem {
  readonly jobId: number;
  readonly pid: number;
  readonly command: string;
  state: JobControlStatus;
  readonly isBackground: boolean;
}

export class JobControlManager {
  private _nextJobId = 1;
  private readonly _jobs = new Map<number, JobControlItem>();
  private _foregroundJobId: number | null = null;

  public createJob(pid: number, command: string, isBackground: boolean = false): JobControlItem {
    const jobId = this._nextJobId++;
    const job: JobControlItem = {
      jobId,
      pid,
      command,
      state: 'RUNNING',
      isBackground,
    };

    this._jobs.set(jobId, job);
    if (!isBackground) {
      this._foregroundJobId = jobId;
    }
    return job;
  }

  public moveToForeground(jobId: number): boolean {
    const job = this._jobs.get(jobId);
    if (!job || job.state === 'TERMINATED') return false;

    job.state = 'RUNNING';
    this._foregroundJobId = jobId;
    return true;
  }

  public moveToBackground(jobId: number): boolean {
    const job = this._jobs.get(jobId);
    if (!job || job.state === 'TERMINATED') return false;

    job.state = 'RUNNING';
    if (this._foregroundJobId === jobId) {
      this._foregroundJobId = null;
    }
    return true;
  }

  public stopForegroundJob(): JobControlItem | null {
    if (this._foregroundJobId === null) return null;
    const job = this._jobs.get(this._foregroundJobId);
    if (job) {
      job.state = 'STOPPED';
      this._foregroundJobId = null;
      return job;
    }
    return null;
  }

  public listJobs(): JobControlItem[] {
    return Array.from(this._jobs.values()).filter((j) => j.state !== 'TERMINATED');
  }

  public getJob(jobId: number): JobControlItem | undefined {
    return this._jobs.get(jobId);
  }
}
