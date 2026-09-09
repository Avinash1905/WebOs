/**
 * @file AppLauncher.ts
 * @description Application launch orchestrator.
 */

import type {
  AppInstance,
  LaunchOptions,
  ApplicationRuntimeDependencies,
} from './types.js';
import { ApplicationRegistry } from './ApplicationRegistry.js';
import { ApplicationContextFactory } from './ApplicationContext.js';
import {
  AppAlreadyRunningError,
  AppLaunchError,
  AppCrashError,
} from './ApplicationError.js';
import { APPLICATION_EVENTS } from './ApplicationEvents.js';
import type { ApplicationManager } from './ApplicationManager.js';

let instanceCounter = 0;
function generateInstanceUuid(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `app_inst_${Date.now()}_${++instanceCounter}_${rand}`;
}

export class AppLauncher {
  private readonly registry: ApplicationRegistry;
  private readonly manager: ApplicationManager;
  private readonly deps: ApplicationRuntimeDependencies;

  constructor(
    registry: ApplicationRegistry,
    manager: ApplicationManager,
    deps: ApplicationRuntimeDependencies
  ) {
    this.registry = registry;
    this.manager = manager;
    this.deps = deps;
  }

  public async launch(
    appId: string,
    options: LaunchOptions = {}
  ): Promise<AppInstance> {
    const manifest = this.registry.getOrThrow(appId);
    const userId = options.userId || this.deps.userManager?.getCurrentUser()?.id || 'root';
    const launchArgs = options.args || {};

    // Check single-instance constraint
    if (!manifest.multiInstance && !options.allowMultiple) {
      const existing = this.manager.getInstancesByAppId(appId);
      if (existing.length > 0 && existing[0]) {
        throw new AppAlreadyRunningError(appId, existing[0].instanceId);
      }
    }

    const instanceId = generateInstanceUuid();
    let processId = 0;

    // Spawn underlying OS process if ProcessManager is present
    if (this.deps.processManager) {
      try {
        const proc = await this.deps.processManager.createProcess(
          {
            name: manifest.name,
            userId,
            applicationId: manifest.id,
            autoStart: true,
            env: options.env,
            metadata: {
              appId,
              instanceId,
              args: launchArgs,
            },
          },
          { userId, isSystem: true }
        );
        processId = proc.pid;
      } catch (err: any) {
        throw new AppLaunchError(appId, `Failed to spawn process: ${err.message}`);
      }
    }

    // Emit launching event
    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_LAUNCHING as any, {
      appId,
      instanceId,
      userId,
      processId,
      timestamp: Date.now(),
    } as any);

    const pauseCallbacks: (() => void)[] = [];
    const resumeCallbacks: (() => void)[] = [];
    const destroyCallbacks: (() => void | Promise<void>)[] = [];

    const instance: AppInstance = {
      instanceId,
      appId,
      processId,
      userId,
      state: 'launching',
      manifest,
      launchArgs,
      pauseCallbacks,
      resumeCallbacks,
      destroyCallbacks,
      launchedAt: Date.now(),
      context: null as any, // assigned below
    };

    const context = ApplicationContextFactory.create(
      appId,
      instanceId,
      processId,
      userId,
      manifest,
      launchArgs,
      this.deps,
      {
        onClose: async () => {
          await this.manager.terminate(instanceId);
        },
        onPause: (cb) => {
          pauseCallbacks.push(cb);
          return () => {
            const idx = pauseCallbacks.indexOf(cb);
            if (idx >= 0) pauseCallbacks.splice(idx, 1);
          };
        },
        onResume: (cb) => {
          resumeCallbacks.push(cb);
          return () => {
            const idx = resumeCallbacks.indexOf(cb);
            if (idx >= 0) resumeCallbacks.splice(idx, 1);
          };
        },
        onDestroy: (cb) => {
          destroyCallbacks.push(cb);
          return () => {
            const idx = destroyCallbacks.indexOf(cb);
            if (idx >= 0) destroyCallbacks.splice(idx, 1);
          };
        },
      }
    );

    (instance as any).context = context;
    this.manager.registerInstance(instance);

    // Run main entry if provided
    if (manifest.main && typeof manifest.main === 'function') {
      try {
        const res = manifest.main(context);
        if (res instanceof Promise) {
          try {
            const cleanup = await res;
            if (typeof cleanup === 'function') {
              instance.cleanupFn = cleanup;
            }
          } catch (err) {
            this.handleAppCrash(instance, err);
            throw new AppCrashError(appId, instanceId, err);
          }
        } else if (typeof res === 'function') {
          instance.cleanupFn = res;
        }
      } catch (err) {
        this.handleAppCrash(instance, err);
        throw new AppCrashError(appId, instanceId, err);
      }
    }

    if (instance.state !== 'crashed') {
      instance.state = 'running';

      // Emit started event
      this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_STARTED as any, {
        appId,
        instanceId,
        userId,
        processId,
        timestamp: Date.now(),
      } as any);
    }

    return instance;
  }

  private handleAppCrash(instance: AppInstance, error: unknown): void {
    instance.state = 'crashed';
    instance.stoppedAt = Date.now();

    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_CRASHED as any, {
      appId: instance.appId,
      instanceId: instance.instanceId,
      userId: instance.userId,
      processId: instance.processId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    } as any);

    // Clean up OS process
    if (this.deps.processManager && instance.processId > 0) {
      try {
        this.deps.processManager.terminateProcess(
          instance.processId,
          { reason: 'App Crash' },
          { isSystem: true }
        ).catch(() => {});
      } catch {
        // ignore
      }
    }
  }
}
