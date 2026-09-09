/**
 * WebOS Backend Foundation - Lifecycle Management
 * Lightweight hook orchestrator for server startup and shutdown phases.
 */

import type { ILogger } from '../common/logging/logger.types.js';

export type LifecycleHook = () => Promise<void> | void;

export type LifecyclePhase =
  | 'beforeStart'
  | 'afterStart'
  | 'beforeShutdown'
  | 'afterShutdown';

export class LifecycleManager {
  private readonly hooks: Record<LifecyclePhase, LifecycleHook[]> = {
    beforeStart: [],
    afterStart: [],
    beforeShutdown: [],
    afterShutdown: []
  };

  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger.child({ subsystem: 'lifecycle-manager' });
  }

  public onBeforeStart(hook: LifecycleHook): void {
    this.hooks.beforeStart.push(hook);
  }

  public onAfterStart(hook: LifecycleHook): void {
    this.hooks.afterStart.push(hook);
  }

  public onBeforeShutdown(hook: LifecycleHook): void {
    this.hooks.beforeShutdown.push(hook);
  }

  public onAfterShutdown(hook: LifecycleHook): void {
    this.hooks.afterShutdown.push(hook);
  }

  public async runPhase(phase: LifecyclePhase): Promise<void> {
    const hookList = this.hooks[phase];
    this.logger.debug({ phase, count: hookList.length }, `Executing lifecycle phase '${phase}'...`);

    for (let i = 0; i < hookList.length; i++) {
      const hook = hookList[i];
      if (hook) {
        try {
          await hook();
        } catch (err) {
          this.logger.error(
            { phase, hookIndex: i, err },
            `Error executing lifecycle hook #${i} in phase '${phase}'`
          );
          throw err;
        }
      }
    }

    this.logger.debug({ phase }, `Completed lifecycle phase '${phase}'.`);
  }
}
