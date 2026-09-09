/**
 * @file ProcessGroupManager.ts
 * @description POSIX Process Group (PGID) and Session (SID) management for WebOS.
 */

export interface ProcessGroup {
  readonly pgid: number;
  readonly leaderPid: number;
  readonly sessionLeaderPid: number;
  readonly pids: readonly number[];
  readonly isForeground: boolean;
  readonly createdAt: number;
}

export class ProcessGroupManager {
  private readonly groups = new Map<number, ProcessGroup>(); // pgid -> ProcessGroup
  private readonly pidToPgid = new Map<number, number>(); // pid -> pgid

  public createGroup(leaderPid: number, sessionLeaderPid?: number, isForeground = true): ProcessGroup {
    const pgid = leaderPid;
    const group: ProcessGroup = {
      pgid,
      leaderPid,
      sessionLeaderPid: sessionLeaderPid ?? leaderPid,
      pids: Object.freeze([leaderPid]),
      isForeground,
      createdAt: Date.now()
    };

    this.groups.set(pgid, group);
    this.pidToPgid.set(leaderPid, pgid);
    return group;
  }

  public joinGroup(pgid: number, pid: number): ProcessGroup {
    const group = this.groups.get(pgid);
    if (!group) throw new Error(`Process group ${pgid} not found`);

    if (group.pids.includes(pid)) return group;

    const updated: ProcessGroup = {
      ...group,
      pids: Object.freeze([...group.pids, pid])
    };

    this.groups.set(pgid, updated);
    this.pidToPgid.set(pid, pgid);
    return updated;
  }

  public leaveGroup(pid: number): boolean {
    const pgid = this.pidToPgid.get(pid);
    if (pgid === undefined) return false;

    this.pidToPgid.delete(pid);
    const group = this.groups.get(pgid);
    if (!group) return false;

    const remaining = group.pids.filter(p => p !== pid);
    if (remaining.length === 0) {
      this.groups.delete(pgid);
    } else {
      this.groups.set(pgid, {
        ...group,
        pids: Object.freeze(remaining)
      });
    }

    return true;
  }

  public getGroup(pgid: number): ProcessGroup | undefined {
    return this.groups.get(pgid);
  }

  public getGroupByPid(pid: number): ProcessGroup | undefined {
    const pgid = this.pidToPgid.get(pid);
    return pgid !== undefined ? this.groups.get(pgid) : undefined;
  }

  public setForegroundGroup(pgid: number): void {
    for (const [id, grp] of this.groups.entries()) {
      this.groups.set(id, {
        ...grp,
        isForeground: id === pgid
      });
    }
  }

  public getForegroundGroup(): ProcessGroup | undefined {
    for (const grp of this.groups.values()) {
      if (grp.isForeground) return grp;
    }
    return undefined;
  }

  public listGroups(): readonly ProcessGroup[] {
    return Array.from(this.groups.values());
  }

  public clear(): void {
    this.groups.clear();
    this.pidToPgid.clear();
  }
}
