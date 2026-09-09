/**
 * @file ApplicationRuntime.ts
 * @description WebOS Application Runtime and Management System Service.
 */

import { BaseSystemService } from '../kernel/index.js';
import type {
  ApplicationManifest,
  AppInstance,
  LaunchOptions,
  AppFilter,
  ApplicationRuntimeDependencies,
  ApplicationRuntimeConfig,
} from './types.js';
import { ApplicationRegistry } from './ApplicationRegistry.js';
import { ApplicationManager } from './ApplicationManager.js';
import { AppLauncher } from './AppLauncher.js';
import { APPLICATION_EVENTS } from './ApplicationEvents.js';

export class ApplicationRuntime extends BaseSystemService {
  public override readonly name = 'apps';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'storage',
    'filesystem',
    'permissions',
    'users',
    'process-manager',
    'clipboard',
  ];

  private readonly registry: ApplicationRegistry;
  private readonly manager: ApplicationManager;
  private readonly launcher: AppLauncher;
  private readonly deps: ApplicationRuntimeDependencies;
  public readonly config: ApplicationRuntimeConfig;

  constructor(
    deps: ApplicationRuntimeDependencies = {},
    config: ApplicationRuntimeConfig = {}
  ) {
    super();

    this.deps = deps;
    this.config = config;
    this.registry = new ApplicationRegistry();
    this.manager = new ApplicationManager(this.deps);
    this.launcher = new AppLauncher(this.registry, this.manager, this.deps);

    this.registerBuiltinApps();
  }

  public getRegistry(): ApplicationRegistry {
    return this.registry;
  }

  public getManager(): ApplicationManager {
    return this.manager;
  }

  protected override async onStart(): Promise<void> {
    // Runtime started
  }

  protected override async onStop(): Promise<void> {
    await this.manager.terminateAll();
  }

  // Registry APIs
  public registerApp(manifest: ApplicationManifest): ApplicationManifest {
    const reg = this.registry.register(manifest);
    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_REGISTERED as any, {
      appId: reg.id,
      name: reg.name,
      version: reg.version,
      timestamp: Date.now(),
    } as any);
    return reg;
  }

  public unregisterApp(appId: string): boolean {
    const existing = this.manager.getInstancesByAppId(appId);
    if (existing.length > 0) {
      for (const inst of existing) {
        this.manager.terminate(inst.instanceId);
      }
    }
    const res = this.registry.unregister(appId);
    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_UNREGISTERED as any, {
      appId,
      timestamp: Date.now(),
    } as any);
    return res;
  }

  public getApp(appId: string): ApplicationManifest | undefined {
    return this.registry.get(appId);
  }

  public getApps(filter?: AppFilter): ApplicationManifest[] {
    if (filter) {
      return this.registry.filter(filter);
    }
    return this.registry.getAll();
  }

  public hasApp(appId: string): boolean {
    return this.registry.has(appId);
  }

  // Lifecycle APIs
  public async launch(appId: string, options?: LaunchOptions): Promise<AppInstance> {
    return this.launcher.launch(appId, options);
  }

  public async terminate(instanceId: string): Promise<void> {
    return this.manager.terminate(instanceId);
  }

  public async terminateApp(appId: string): Promise<void> {
    const instances = this.manager.getInstancesByAppId(appId);
    for (const inst of instances) {
      await this.manager.terminate(inst.instanceId);
    }
  }

  public async pause(instanceId: string): Promise<void> {
    return this.manager.pause(instanceId);
  }

  public async resume(instanceId: string): Promise<void> {
    return this.manager.resume(instanceId);
  }

  public async restart(instanceId: string): Promise<AppInstance> {
    const current = this.manager.getInstance(instanceId);
    if (!current) {
      throw new Error(`Instance '${instanceId}' not found for restart`);
    }

    const appId = current.appId;
    const launchArgs = { ...current.launchArgs };
    const userId = current.userId;

    await this.terminate(instanceId);
    return this.launch(appId, { userId, args: launchArgs });
  }

  public getInstance(instanceId: string): AppInstance | undefined {
    return this.manager.getInstance(instanceId);
  }

  public getInstances(appId?: string): AppInstance[] {
    if (appId) {
      return this.manager.getInstancesByAppId(appId);
    }
    return this.manager.getAllInstances();
  }

  public getRunningApps(): { manifest: ApplicationManifest; instances: AppInstance[] }[] {
    const result: { manifest: ApplicationManifest; instances: AppInstance[] }[] = [];
    const all = this.registry.getAll();
    for (const m of all) {
      const instances = this.manager.getInstancesByAppId(m.id);
      if (instances.length > 0) {
        result.push({ manifest: m, instances });
      }
    }
    return result;
  }

  public isAppRunning(appId: string): boolean {
    return this.manager.getInstancesByAppId(appId).length > 0;
  }

  private registerBuiltinApps(): void {
    // 1. Notepad / Text Editor
    this.registry.register({
      id: 'com.webos.notepad',
      name: 'Text Editor',
      version: '1.0.0',
      description: 'Simple text editor for viewing and editing text files',
      category: 'Utilities',
      fileExtensions: ['.txt', '.md', '.json', '.js', '.ts', '.log'],
      multiInstance: true,
      permissions: ['filesystem:read', 'filesystem:write', 'clipboard:read', 'clipboard:write'],
      systemApp: true,
      defaultWidth: 640,
      defaultHeight: 480,
    });

    // 2. File Explorer
    this.registry.register({
      id: 'com.webos.files',
      name: 'Files',
      version: '1.0.0',
      description: 'Virtual File System manager',
      category: 'System',
      multiInstance: true,
      permissions: ['filesystem:read', 'filesystem:write', 'clipboard:read', 'clipboard:write'],
      systemApp: true,
      defaultWidth: 800,
      defaultHeight: 600,
    });

    // 3. Terminal / Shell
    this.registry.register({
      id: 'com.webos.terminal',
      name: 'Terminal',
      version: '1.0.0',
      description: 'WebOS Command Line Interface',
      category: 'System',
      multiInstance: true,
      permissions: [
        'filesystem:read',
        'filesystem:write',
        'process:manage',
        'clipboard:read',
        'clipboard:write',
        'system:admin',
      ],
      systemApp: true,
      defaultWidth: 720,
      defaultHeight: 450,
    });

    // 4. Task Manager
    this.registry.register({
      id: 'com.webos.taskmgr',
      name: 'Task Manager',
      version: '1.0.0',
      description: 'Monitor processes, services, and system performance',
      category: 'System',
      multiInstance: false,
      permissions: ['process:manage', 'system:admin'],
      systemApp: true,
      defaultWidth: 600,
      defaultHeight: 500,
    });

    // 5. Settings
    this.registry.register({
      id: 'com.webos.settings',
      name: 'Settings',
      version: '1.0.0',
      description: 'System preferences and user configuration',
      category: 'System',
      multiInstance: false,
      permissions: ['storage:read', 'storage:write', 'system:admin'],
      systemApp: true,
      defaultWidth: 700,
      defaultHeight: 520,
    });

    // 6. Calculator
    this.registry.register({
      id: 'com.webos.calculator',
      name: 'Calculator',
      version: '1.0.0',
      description: 'Basic and scientific calculator',
      category: 'Utilities',
      multiInstance: false,
      permissions: ['clipboard:read', 'clipboard:write'],
      systemApp: false,
      defaultWidth: 320,
      defaultHeight: 460,
    });
  }
}
