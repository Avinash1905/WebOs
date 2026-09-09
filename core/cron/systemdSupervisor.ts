import { ServiceUnit } from './types';

export class ServiceSupervisor {
  private static instance: ServiceSupervisor;
  private services: Map<string, ServiceUnit> = new Map();

  private constructor() {
    this.registerBuiltinServices();
    this.startSupervisorLoop();
  }

  public static getInstance(): ServiceSupervisor {
    if (!ServiceSupervisor.instance) {
      ServiceSupervisor.instance = new ServiceSupervisor();
    }
    return ServiceSupervisor.instance;
  }

  private registerBuiltinServices(): void {
    this.registerService({
      id: 'vfs-daemon',
      name: 'VFS Storage Synchronization Daemon',
      description: 'Maintains IndexedDB persistence and inotify events for virtual filesystem',
      dependencies: [],
      restartPolicy: 'always',
      state: 'running',
      cpuPercent: 0.2,
      memoryMb: 12.4,
      startedAt: Date.now(),
      uptimeSeconds: 0,
      start: async () => {},
      stop: async () => {},
    });

    this.registerService({
      id: 'network-manager',
      name: 'Network Connection Manager',
      description: 'Manages virtual TCP/IP stack, DNS routing, and DHCP leases',
      dependencies: [],
      restartPolicy: 'always',
      state: 'running',
      cpuPercent: 0.1,
      memoryMb: 8.2,
      startedAt: Date.now(),
      uptimeSeconds: 0,
      start: async () => {},
      stop: async () => {},
    });

    this.registerService({
      id: 'sync-engine',
      name: 'Cloud Delta Synchronization Worker',
      description: 'Synchronizes VFS changes with remote PostgreSQL backend via WebSockets',
      dependencies: ['vfs-daemon', 'network-manager'],
      restartPolicy: 'on-failure',
      state: 'running',
      cpuPercent: 0.4,
      memoryMb: 16.8,
      startedAt: Date.now(),
      uptimeSeconds: 0,
      start: async () => {},
      stop: async () => {},
    });

    this.registerService({
      id: 'audio-server',
      name: 'PulseAudio / CoreAudio Synthesizer Server',
      description: 'Provides low-latency WebAudio mixing and DSP pipeline routing',
      dependencies: [],
      restartPolicy: 'always',
      state: 'running',
      cpuPercent: 0.3,
      memoryMb: 18.1,
      startedAt: Date.now(),
      uptimeSeconds: 0,
      start: async () => {},
      stop: async () => {},
    });
  }

  private startSupervisorLoop(): void {
    setInterval(() => {
      for (const service of this.services.values()) {
        if (service.state === 'running') {
          service.uptimeSeconds = Math.floor((Date.now() - (service.startedAt || Date.now())) / 1000);
          service.cpuPercent = +(Math.random() * 0.8 + 0.1).toFixed(2);
        }
      }
    }, 2000);
  }

  public registerService(service: ServiceUnit): void {
    this.services.set(service.id, service);
  }

  public async startService(id: string): Promise<boolean> {
    const s = this.services.get(id);
    if (!s) return false;

    // Start dependencies first
    for (const depId of s.dependencies) {
      const dep = this.services.get(depId);
      if (dep && dep.state !== 'running') {
        await this.startService(depId);
      }
    }

    s.state = 'starting';
    try {
      await s.start();
      s.state = 'running';
      s.startedAt = Date.now();
      return true;
    } catch (e) {
      s.state = 'failed';
      return false;
    }
  }

  public async stopService(id: string): Promise<boolean> {
    const s = this.services.get(id);
    if (!s) return false;

    s.state = 'stopping';
    try {
      await s.stop();
      s.state = 'stopped';
      return true;
    } catch (e) {
      s.state = 'failed';
      return false;
    }
  }

  public async restartService(id: string): Promise<boolean> {
    await this.stopService(id);
    return this.startService(id);
  }

  public getService(id: string): ServiceUnit | undefined {
    return this.services.get(id);
  }

  public listServices(): ServiceUnit[] {
    return Array.from(this.services.values());
  }
}

export const serviceSupervisor = ServiceSupervisor.getInstance();
