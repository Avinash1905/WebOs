/**
 * Member 2 Integration Boundary: OS Core Services
 * 
 * Member 1 (UI/Desktop Shell) uses this contract to interact with OS processes,
 * file system queries, and system event triggers without implementing core logic.
 */

export interface ProcessInfo {
  pid: number;
  appId: string;
  name: string;
  memoryUsageMb: number;
  cpuPercent: number;
  startedAt: number;
  status: 'running' | 'suspended' | 'terminated';
}

export interface FileSystemNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes?: number;
  createdAt: number;
  modifiedAt: number;
  extension?: string;
  icon?: string;
}

export interface SystemEventPayload {
  type: string;
  source: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface IOSCoreService {
  launchApplication(appId: string, args?: Record<string, unknown>): Promise<{ pid: number; success: boolean }>;
  terminateProcess(pid: number): Promise<boolean>;
  getRunningProcesses(): Promise<ProcessInfo[]>;
  getFileSystem(): Promise<FileSystemNode[]>;
  subscribeToSystemEvents(listener: (event: SystemEventPayload) => void): () => void;
}

/**
 * Default mock/adapter implementation for Phase 1 isolation.
 * Member 2 will connect real kernel & process tree implementation in their phase.
 */
export class MockOSCoreAdapter implements IOSCoreService {
  async launchApplication(_appId: string): Promise<{ pid: number; success: boolean }> {
    return { pid: Math.floor(Math.random() * 10000) + 1000, success: true };
  }

  async terminateProcess(_pid: number): Promise<boolean> {
    return true;
  }

  async getRunningProcesses(): Promise<ProcessInfo[]> {
    return [
      { pid: 1, appId: 'system', name: 'WebOS Kernel', memoryUsageMb: 12, cpuPercent: 0.1, startedAt: Date.now(), status: 'running' }
    ];
  }

  async getFileSystem(): Promise<FileSystemNode[]> {
    return [
      { id: 'root', name: 'Root', path: '/', type: 'directory', createdAt: Date.now(), modifiedAt: Date.now() },
      { id: 'docs', name: 'Documents', path: '/Documents', type: 'directory', createdAt: Date.now(), modifiedAt: Date.now() }
    ];
  }

  subscribeToSystemEvents(_listener: (event: SystemEventPayload) => void): () => void {
    return () => {};
  }
}

export const osCoreService = new MockOSCoreAdapter();
