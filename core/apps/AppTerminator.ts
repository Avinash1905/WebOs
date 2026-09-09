/**
 * @file AppTerminator.ts
 * @description Application termination and cleanup handler.
 */

import type { AppInstance, ApplicationRuntimeDependencies } from './types.js';
import { APPLICATION_EVENTS } from './ApplicationEvents.js';

export class AppTerminator {
  private readonly deps: ApplicationRuntimeDependencies;

  constructor(deps: ApplicationRuntimeDependencies) {
    this.deps = deps;
  }

  public async terminate(instance: AppInstance): Promise<void> {
    if (instance.state === 'stopped' || instance.state === 'stopping') {
      return;
    }

    instance.state = 'stopping';

    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_STOPPING as any, {
      appId: instance.appId,
      instanceId: instance.instanceId,
      userId: instance.userId,
      processId: instance.processId,
      timestamp: Date.now(),
    } as any);

    // Execute destroy callbacks
    for (const cb of instance.destroyCallbacks) {
      try {
        await cb();
      } catch (err) {
        console.error(`Error in destroy callback for ${instance.appId}:`, err);
      }
    }

    // Execute cleanup function if returned from main
    if (instance.cleanupFn) {
      try {
        await instance.cleanupFn();
      } catch (err) {
        console.error(`Error in cleanup function for ${instance.appId}:`, err);
      }
    }

    // Terminate process if running
    if (this.deps.processManager && instance.processId > 0) {
      try {
        await this.deps.processManager.terminateProcess(
          instance.processId,
          { reason: 'App Terminated' },
          { isSystem: true }
        );
      } catch {
        // Process might already be dead
      }
    }

    instance.state = 'stopped';
    instance.stoppedAt = Date.now();

    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_STOPPED as any, {
      appId: instance.appId,
      instanceId: instance.instanceId,
      userId: instance.userId,
      processId: instance.processId,
      timestamp: Date.now(),
    } as any);
  }
}
