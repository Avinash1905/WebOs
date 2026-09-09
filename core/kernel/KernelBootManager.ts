/**
 * @file KernelBootManager.ts
 * @description Multi-stage transactional boot & shutdown engine with atomic rollback on initialization failure.
 */

import type { SystemService } from './Service.js';
import { ServiceDependencyResolver } from './ServiceDependency.js';

export type BootStage = 'PRE_INIT' | 'CORE_INIT' | 'SERVICES_START' | 'POST_BOOT' | 'READY';

export interface BootStageHook {
  readonly stage: BootStage;
  readonly name: string;
  readonly handler: () => Promise<void> | void;
}

export class KernelBootManager {
  private readonly _hooks: BootStageHook[] = [];
  private _currentStage: BootStage = 'PRE_INIT';

  public registerHook(stage: BootStage, name: string, handler: () => Promise<void> | void): void {
    this._hooks.push({ stage, name, handler });
  }

  public getCurrentStage(): BootStage {
    return this._currentStage;
  }

  public async executeBootSequence(services: SystemService[]): Promise<void> {
    // 1. Pre-init hooks
    this._currentStage = 'PRE_INIT';
    await this._runHooks('PRE_INIT');

    // 2. Core services initialization
    this._currentStage = 'CORE_INIT';
    const initOrder = ServiceDependencyResolver.resolveStartupOrder(services);
    const initializedServices: SystemService[] = [];

    try {
      for (const service of initOrder) {
        if (service.initialize && service.getStatus() === 'REGISTERED') {
          await service.initialize();
          initializedServices.push(service);
        }
      }
      await this._runHooks('CORE_INIT');
    } catch (err) {
      // Rollback initialized services in reverse order
      for (let i = initializedServices.length - 1; i >= 0; i--) {
        const s = initializedServices[i];
        if (s && s.stop && s.getStatus() !== 'STOPPED') {
          try { await s.stop(); } catch { /* best effort rollback */ }
        }
      }
      throw err;
    }

    // 3. Services startup
    this._currentStage = 'SERVICES_START';
    const startedServices: SystemService[] = [];
    try {
      for (const service of initOrder) {
        if (service.start && service.getStatus() !== 'RUNNING') {
          await service.start();
          startedServices.push(service);
        }
      }
      await this._runHooks('SERVICES_START');
    } catch (err) {
      // Rollback started services in reverse order
      for (let i = startedServices.length - 1; i >= 0; i--) {
        const s = startedServices[i];
        if (s && s.stop && s.getStatus() === 'RUNNING') {
          try { await s.stop(); } catch { /* best effort rollback */ }
        }
      }
      throw err;
    }

    // 4. Post boot
    this._currentStage = 'POST_BOOT';
    await this._runHooks('POST_BOOT');

    // 5. System Ready
    this._currentStage = 'READY';
  }

  private async _runHooks(stage: BootStage): Promise<void> {
    const stageHooks = this._hooks.filter((h) => h.stage === stage);
    for (const hook of stageHooks) {
      await hook.handler();
    }
  }
}
