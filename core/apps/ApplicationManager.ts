/**
 * @file ApplicationManager.ts
 * @description Manager for active application instances, pausing, resuming, and termination.
 */

import type { AppInstance, ApplicationRuntimeDependencies } from './types.js';
import { AppTerminator } from './AppTerminator.js';
import { APPLICATION_EVENTS } from './ApplicationEvents.js';

export class ApplicationManager {
  private readonly instances = new Map<string, AppInstance>();
  private readonly terminator: AppTerminator;
  private readonly deps: ApplicationRuntimeDependencies;

  constructor(deps: ApplicationRuntimeDependencies) {
    this.deps = deps;
    this.terminator = new AppTerminator(deps);
  }

  public registerInstance(instance: AppInstance): void {
    this.instances.set(instance.instanceId, instance);
  }

  public getInstance(instanceId: string): AppInstance | undefined {
    return this.instances.get(instanceId);
  }

  public getInstancesByAppId(appId: string): AppInstance[] {
    return Array.from(this.instances.values()).filter(
      (inst) => inst.appId === appId && inst.state !== 'stopped'
    );
  }

  public getInstancesByUser(userId: string): AppInstance[] {
    return Array.from(this.instances.values()).filter(
      (inst) => inst.userId === userId && inst.state !== 'stopped'
    );
  }

  public getAllInstances(): AppInstance[] {
    return Array.from(this.instances.values()).filter(
      (inst) => inst.state !== 'stopped'
    );
  }

  public async pause(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== 'running') {
      return;
    }

    for (const cb of instance.pauseCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error('Error in pause callback:', err);
      }
    }

    instance.state = 'paused';

    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_PAUSED as any, {
      appId: instance.appId,
      instanceId: instance.instanceId,
      userId: instance.userId,
      processId: instance.processId,
      timestamp: Date.now(),
    } as any);
  }

  public async resume(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== 'paused') {
      return;
    }

    for (const cb of instance.resumeCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error('Error in resume callback:', err);
      }
    }

    instance.state = 'running';

    this.deps.eventBus?.emit(APPLICATION_EVENTS.APP_RESUMED as any, {
      appId: instance.appId,
      instanceId: instance.instanceId,
      userId: instance.userId,
      processId: instance.processId,
      timestamp: Date.now(),
    } as any);
  }

  public async terminate(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return;
    }

    await this.terminator.terminate(instance);
    this.instances.delete(instanceId);
  }

  public async terminateAll(userId?: string): Promise<void> {
    const targetInstances = userId
      ? this.getInstancesByUser(userId)
      : this.getAllInstances();

    for (const instance of targetInstances) {
      await this.terminate(instance.instanceId);
    }
  }

  public clear(): void {
    this.instances.clear();
  }
}
