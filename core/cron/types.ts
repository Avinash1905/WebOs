/**
 * WebOS Core - Cron & Service Supervisor Types
 */

export interface CronJob {
  id: string;
  name: string;
  expression: string;
  command: string;
  enabled: boolean;
  lastRunTimestamp?: number;
  nextRunTimestamp?: number;
  executionCount: number;
}

export type ServiceRestartPolicy = 'no' | 'always' | 'on-failure' | 'unless-stopped';
export type ServiceState = 'stopped' | 'starting' | 'running' | 'stopping' | 'failed' | 'degraded';

export interface ServiceUnit {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  restartPolicy: ServiceRestartPolicy;
  state: ServiceState;
  pid?: number;
  cpuPercent: number;
  memoryMb: number;
  startedAt?: number;
  uptimeSeconds: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
