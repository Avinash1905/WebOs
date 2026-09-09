/**
 * @file ProcessCgroupController.ts
 * @description Linux cgroups v2 resource hierarchy (cpu.weight, memory.max, pids.max) simulation.
 */

export interface CgroupLimits {
  readonly cpuWeight: number;    // 1-1000
  readonly memoryMaxBytes: number;
  readonly pidsMax: number;
}

export interface CgroupNode {
  readonly name: string;
  readonly parent?: string;
  limits: CgroupLimits;
  pids: Set<number>;
  usedMemoryBytes: number;
}

export class ProcessCgroupController {
  private readonly _groups = new Map<string, CgroupNode>();

  constructor() {
    // Root cgroup
    this._groups.set('root', {
      name: 'root',
      limits: {
        cpuWeight: 100,
        memoryMaxBytes: 1024 * 1024 * 1024, // 1GB
        pidsMax: 10000,
      },
      pids: new Set(),
      usedMemoryBytes: 0,
    });
  }

  public createGroup(name: string, limits?: Partial<CgroupLimits>, parent: string = 'root'): CgroupNode {
    const node: CgroupNode = {
      name,
      parent,
      limits: {
        cpuWeight: limits?.cpuWeight ?? 100,
        memoryMaxBytes: limits?.memoryMaxBytes ?? 128 * 1024 * 1024,
        pidsMax: limits?.pidsMax ?? 100,
      },
      pids: new Set(),
      usedMemoryBytes: 0,
    };
    this._groups.set(name, node);
    return node;
  }

  public attachProcess(groupName: string, pid: number): boolean {
    const group = this._groups.get(groupName);
    if (!group) return false;

    if (group.pids.size >= group.limits.pidsMax) {
      return false; // pids.max limit reached
    }

    group.pids.add(pid);
    return true;
  }

  public trackMemory(groupName: string, bytesDelta: number): { allowed: boolean; oomTriggered: boolean } {
    const group = this._groups.get(groupName);
    if (!group) return { allowed: true, oomTriggered: false };

    const newUsage = group.usedMemoryBytes + bytesDelta;
    if (newUsage > group.limits.memoryMaxBytes) {
      return { allowed: false, oomTriggered: true }; // OOM trigger
    }

    group.usedMemoryBytes = Math.max(0, newUsage);
    return { allowed: true, oomTriggered: false };
  }

  public getGroup(name: string): CgroupNode | undefined {
    return this._groups.get(name);
  }
}
