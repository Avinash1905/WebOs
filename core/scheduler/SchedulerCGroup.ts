/**
 * @file SchedulerCGroup.ts
 * @description Control Groups (cgroups) for CPU and resource bandwidth budgeting.
 */

export interface CGroupLimits {
  readonly cpuShares: number; // e.g. 1024
  readonly cpuQuotaUs: number; // e.g. 50000 (50ms per period)
  readonly cpuPeriodUs: number; // e.g. 100000 (100ms)
  readonly maxPids: number;
}

export class SchedulerCGroup {
  private readonly groups = new Map<string, { name: string; limits: CGroupLimits; pids: Set<number> }>();

  public createGroup(name: string, limits?: Partial<CGroupLimits>): void {
    this.groups.set(name, {
      name,
      limits: {
        cpuShares: limits?.cpuShares ?? 1024,
        cpuQuotaUs: limits?.cpuQuotaUs ?? -1,
        cpuPeriodUs: limits?.cpuPeriodUs ?? 100000,
        maxPids: limits?.maxPids ?? 256
      },
      pids: new Set()
    });
  }

  public assignPid(groupName: string, pid: number): boolean {
    const grp = this.groups.get(groupName);
    if (!grp) return false;
    if (grp.pids.size >= grp.limits.maxPids) return false;
    grp.pids.add(pid);
    return true;
  }

  public removePid(groupName: string, pid: number): boolean {
    const grp = this.groups.get(groupName);
    return grp ? grp.pids.delete(pid) : false;
  }

  public getGroupForPid(pid: number): string | undefined {
    for (const [name, grp] of this.groups.entries()) {
      if (grp.pids.has(pid)) return name;
    }
    return undefined;
  }

  public getLimits(groupName: string): CGroupLimits | undefined {
    return this.groups.get(groupName)?.limits;
  }
}
