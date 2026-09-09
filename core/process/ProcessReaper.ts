/**
 * @file ProcessReaper.ts
 * @description Zombie process collector and orphan reparenting engine.
 */

export interface ZombieRecord {
  readonly pid: number;
  readonly parentPid: number;
  readonly exitCode: number;
  readonly terminatedAt: number;
}

export class ProcessReaper {
  private readonly zombies = new Map<number, ZombieRecord>(); // pid -> ZombieRecord
  private readonly parentMap = new Map<number, number>(); // pid -> parentPid

  public recordProcess(pid: number, parentPid = 1): void {
    this.parentMap.set(pid, parentPid);
  }

  public recordExit(pid: number, exitCode = 0): void {
    const parentPid = this.parentMap.get(pid) ?? 1;
    this.zombies.set(pid, {
      pid,
      parentPid,
      exitCode,
      terminatedAt: Date.now()
    });
  }

  public waitPid(parentPid: number, targetPid = -1): ZombieRecord | undefined {
    for (const [pid, zombie] of this.zombies.entries()) {
      if (zombie.parentPid === parentPid && (targetPid === -1 || pid === targetPid)) {
        this.zombies.delete(pid);
        this.parentMap.delete(pid);
        return zombie;
      }
    }
    return undefined;
  }

  public reparentOrphans(deadParentPid: number, newParentPid = 1): number {
    let reparented = 0;
    for (const [pid, parent] of this.parentMap.entries()) {
      if (parent === deadParentPid) {
        this.parentMap.set(pid, newParentPid);
        reparented++;
      }
    }
    for (const [pid, zombie] of this.zombies.entries()) {
      if (zombie.parentPid === deadParentPid) {
        this.zombies.set(pid, { ...zombie, parentPid: newParentPid });
      }
    }
    return reparented;
  }

  public getZombieCount(): number {
    return this.zombies.size;
  }

  public clear(): void {
    this.zombies.clear();
    this.parentMap.clear();
  }
}
