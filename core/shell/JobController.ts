/**
 * @file JobController.ts
 * @description Shell job control managing background tasks and foreground switching.
 */

export type JobState = 'RUNNING' | 'STOPPED' | 'DONE';

export interface ShellJob {
  readonly jobId: number;
  readonly pid: number;
  readonly command: string;
  state: JobState;
  readonly startedAt: number;
}

export class JobController {
  private readonly jobs = new Map<number, ShellJob>();
  private nextJobId = 1;

  public addJob(pid: number, command: string, state: JobState = 'RUNNING'): ShellJob {
    const jobId = this.nextJobId++;
    const job: ShellJob = {
      jobId,
      pid,
      command,
      state,
      startedAt: Date.now()
    };
    this.jobs.set(jobId, job);
    return job;
  }

  public getJob(jobId: number): ShellJob | undefined {
    return this.jobs.get(jobId);
  }

  public getJobByPid(pid: number): ShellJob | undefined {
    for (const job of this.jobs.values()) {
      if (job.pid === pid) return job;
    }
    return undefined;
  }

  public updateJobState(jobId: number, state: JobState): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.state = state;
    }
  }

  public removeJob(jobId: number): boolean {
    return this.jobs.delete(jobId);
  }

  public listJobs(): readonly ShellJob[] {
    return Array.from(this.jobs.values());
  }

  public clear(): void {
    this.jobs.clear();
  }
}
