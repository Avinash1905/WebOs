/**
 * member2Adapters.ts
 * Member 1 -> Member 2 Integration Bridge
 * 
 * Formalized frontend adapters and contracts for communicating with Member 2's
 * OS Core, Process Management, Virtual File System (VFS), System Events,
 * Clipboard, and System Telemetry without leaking OS internals into the UI layer.
 */

import { ProcessInfo, SystemEventPayload } from './osCore';

export interface VFSFileStat {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes: number;
  mimeType: string;
  createdAt: number;
  modifiedAt: number;
  permissions: {
    readable: boolean;
    writable: boolean;
    executable: boolean;
  };
}

export interface ProcessLaunchOptions {
  appId: string;
  args?: Record<string, unknown>;
  cwd?: string;
  env?: Record<string, string>;
  initialWindowRect?: { x: number; y: number; width: number; height: number };
}

export interface ProcessLaunchResult {
  pid: number;
  appId: string;
  success: boolean;
  error?: string;
}

export interface IMember2OSCoreContract {
  // Process Lifecycle
  spawnProcess(options: ProcessLaunchOptions): Promise<ProcessLaunchResult>;
  killProcess(pid: number, signal?: 'SIGTERM' | 'SIGKILL'): Promise<boolean>;
  listProcesses(): Promise<ProcessInfo[]>;
  getProcess(pid: number): Promise<ProcessInfo | null>;

  // Virtual File System
  readFile(path: string): Promise<Uint8Array | string>;
  writeFile(path: string, content: Uint8Array | string): Promise<boolean>;
  deleteFile(path: string): Promise<boolean>;
  listDirectory(path: string): Promise<VFSFileStat[]>;
  createDirectory(path: string): Promise<boolean>;

  // System Events & IPC
  dispatchSystemEvent(event: SystemEventPayload): void;
  onSystemEvent(eventType: string, handler: (payload: SystemEventPayload) => void): () => void;

  // System Clipboard & Permissions
  readClipboard(): Promise<string>;
  writeClipboard(text: string): Promise<boolean>;
  queryPermission(name: 'notifications' | 'clipboard' | 'filesystem'): Promise<'granted' | 'denied' | 'prompt'>;
}

/**
 * Production-ready mock runtime adapter for standalone frontend operation.
 * Automatically delegates to window.__WEBOS_CORE__ if injected by Member 2 runtime.
 */
export class Member2OSBridge implements IMember2OSCoreContract {
  private static instance: Member2OSBridge;
  private eventHandlers: Map<string, Set<(payload: SystemEventPayload) => void>> = new Map();
  private mockProcesses: Map<number, ProcessInfo> = new Map();
  private nextPid = 1000;

  private constructor() {
    this.mockProcesses.set(1, {
      pid: 1,
      appId: 'kernel',
      name: 'WebOS Microkernel',
      memoryUsageMb: 16,
      cpuPercent: 0.1,
      startedAt: Date.now(),
      status: 'running',
    });
  }

  public static getInstance(): Member2OSBridge {
    if (!Member2OSBridge.instance) {
      Member2OSBridge.instance = new Member2OSBridge();
    }
    return Member2OSBridge.instance;
  }

  private get externalCore(): IMember2OSCoreContract | null {
    if (typeof window !== 'undefined' && (window as unknown as { __WEBOS_CORE__?: IMember2OSCoreContract }).__WEBOS_CORE__) {
      return (window as unknown as { __WEBOS_CORE__: IMember2OSCoreContract }).__WEBOS_CORE__;
    }
    return null;
  }

  async spawnProcess(options: ProcessLaunchOptions): Promise<ProcessLaunchResult> {
    if (this.externalCore) {
      return this.externalCore.spawnProcess(options);
    }

    const pid = ++this.nextPid;
    const info: ProcessInfo = {
      pid,
      appId: options.appId,
      name: options.appId.toUpperCase(),
      memoryUsageMb: Math.floor(Math.random() * 25) + 10,
      cpuPercent: +(Math.random() * 1.5).toFixed(1),
      startedAt: Date.now(),
      status: 'running',
    };
    this.mockProcesses.set(pid, info);

    this.dispatchSystemEvent({
      type: 'process:spawned',
      source: 'osCore',
      timestamp: Date.now(),
      data: { pid, appId: options.appId },
    });

    return { pid, appId: options.appId, success: true };
  }

  async killProcess(pid: number): Promise<boolean> {
    if (this.externalCore) {
      return this.externalCore.killProcess(pid);
    }

    const exists = this.mockProcesses.has(pid);
    if (exists) {
      this.mockProcesses.delete(pid);
      this.dispatchSystemEvent({
        type: 'process:terminated',
        source: 'osCore',
        timestamp: Date.now(),
        data: { pid },
      });
    }
    return exists;
  }

  async listProcesses(): Promise<ProcessInfo[]> {
    if (this.externalCore) {
      return this.externalCore.listProcesses();
    }
    return Array.from(this.mockProcesses.values());
  }

  async getProcess(pid: number): Promise<ProcessInfo | null> {
    if (this.externalCore) {
      return this.externalCore.getProcess(pid);
    }
    return this.mockProcesses.get(pid) || null;
  }

  async readFile(path: string): Promise<string | Uint8Array> {
    if (this.externalCore) {
      return this.externalCore.readFile(path);
    }
    return `// Sample content of ${path}\nWebOS VFS Mock Content`;
  }

  async writeFile(path: string, _content: Uint8Array | string): Promise<boolean> {
    if (this.externalCore) {
      return this.externalCore.writeFile(path, _content);
    }
    return true;
  }

  async deleteFile(path: string): Promise<boolean> {
    if (this.externalCore) {
      return this.externalCore.deleteFile(path);
    }
    return true;
  }

  async listDirectory(path: string): Promise<VFSFileStat[]> {
    if (this.externalCore) {
      return this.externalCore.listDirectory(path);
    }
    return [
      {
        id: 'file-1',
        name: 'README.md',
        path: `${path}/README.md`.replace('//', '/'),
        type: 'file',
        sizeBytes: 1024,
        mimeType: 'text/markdown',
        createdAt: Date.now() - 3600000,
        modifiedAt: Date.now(),
        permissions: { readable: true, writable: true, executable: false },
      },
      {
        id: 'folder-1',
        name: 'Documents',
        path: `${path}/Documents`.replace('//', '/'),
        type: 'directory',
        sizeBytes: 4096,
        mimeType: 'inode/directory',
        createdAt: Date.now() - 86400000,
        modifiedAt: Date.now(),
        permissions: { readable: true, writable: true, executable: true },
      },
    ];
  }

  async createDirectory(path: string): Promise<boolean> {
    if (this.externalCore) {
      return this.externalCore.createDirectory(path);
    }
    return true;
  }

  dispatchSystemEvent(event: SystemEventPayload): void {
    if (this.externalCore) {
      this.externalCore.dispatchSystemEvent(event);
      return;
    }

    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(event);
        } catch (e) {
          console.error(`Error in event listener for ${event.type}:`, e);
        }
      });
    }
  }

  onSystemEvent(eventType: string, handler: (payload: SystemEventPayload) => void): () => void {
    if (this.externalCore) {
      return this.externalCore.onSystemEvent(eventType, handler);
    }

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  async readClipboard(): Promise<string> {
    if (this.externalCore) {
      return this.externalCore.readClipboard();
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    }
    return '';
  }

  async writeClipboard(text: string): Promise<boolean> {
    if (this.externalCore) {
      return this.externalCore.writeClipboard(text);
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async queryPermission(name: 'notifications' | 'clipboard' | 'filesystem'): Promise<'granted' | 'denied' | 'prompt'> {
    if (this.externalCore) {
      return this.externalCore.queryPermission(name);
    }
    return 'granted';
  }
}

export const member2Bridge = Member2OSBridge.getInstance();
