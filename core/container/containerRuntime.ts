/**
 * WebOS Container Engine & Isolated Execution Jail
 */

export interface ContainerConfig {
  id: string;
  name: string;
  image: string;
  command: string[];
  environment: Record<string, string>;
  cpuLimitShares: number;
  memoryLimitBytes: number;
  mounts: { hostPath: string; containerPath: string; readOnly: boolean }[];
}

export interface ContainerStats {
  id: string;
  status: 'created' | 'running' | 'paused' | 'stopped';
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  pidsCount: number;
  startedAt?: string;
}

export class ContainerRuntime {
  private static instance: ContainerRuntime;
  private containers: Map<string, { config: ContainerConfig; stats: ContainerStats }> = new Map();

  private constructor() {
    this.createSystemContainers();
  }

  public static getInstance(): ContainerRuntime {
    if (!ContainerRuntime.instance) {
      ContainerRuntime.instance = new ContainerRuntime();
    }
    return ContainerRuntime.instance;
  }

  private createSystemContainers(): void {
    this.createContainer({
      id: 'ctr-postgres-16',
      name: 'webos-postgres-prod',
      image: 'postgres:16-alpine',
      command: ['postgres', '-D', '/var/lib/postgresql/data'],
      environment: { POSTGRES_DB: 'webos', POSTGRES_USER: 'postgres' },
      cpuLimitShares: 1024,
      memoryLimitBytes: 512 * 1024 * 1024,
      mounts: [{ hostPath: '/var/lib/webos/db', containerPath: '/var/lib/postgresql/data', readOnly: false }],
    });

    this.createContainer({
      id: 'ctr-redis-cache',
      name: 'webos-redis-cache',
      image: 'redis:7.2-alpine',
      command: ['redis-server', '--maxmemory', '256mb', '--maxmemory-policy', 'allkeys-lru'],
      environment: {},
      cpuLimitShares: 512,
      memoryLimitBytes: 256 * 1024 * 1024,
      mounts: [],
    });
  }

  public createContainer(config: ContainerConfig): ContainerStats {
    const stats: ContainerStats = {
      id: config.id,
      status: 'running',
      cpuUsagePercent: 2.5,
      memoryUsageBytes: 64 * 1024 * 1024,
      pidsCount: 4,
      startedAt: new Date().toISOString(),
    };
    this.containers.set(config.id, { config, stats });
    return stats;
  }

  public getContainers(): ContainerStats[] {
    return Array.from(this.containers.values()).map((c) => c.stats);
  }

  public startContainer(id: string): boolean {
    const item = this.containers.get(id);
    if (!item) return false;
    item.stats.status = 'running';
    item.stats.startedAt = new Date().toISOString();
    return true;
  }

  public stopContainer(id: string): boolean {
    const item = this.containers.get(id);
    if (!item) return false;
    item.stats.status = 'stopped';
    return true;
  }

  public removeContainer(id: string): boolean {
    return this.containers.delete(id);
  }
}

export const containerRuntime = ContainerRuntime.getInstance();
