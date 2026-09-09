/**
 * @file mocks.ts
 * @description Mock SystemService implementations for unit testing the WebOS Kernel.
 */

import { BaseSystemService } from '../core/kernel/Service.js';
import type { ServiceStatus } from '../core/kernel/types.js';

export interface MockServiceCallLog {
  service: string;
  action: 'initialize' | 'start' | 'stop' | 'reset';
  timestamp: number;
}

export class MockService extends BaseSystemService {
  public override readonly name: string;
  public override readonly dependencies: readonly string[];
  public override readonly optionalDependencies: readonly string[];

  public initializeCallCount = 0;
  public startCallCount = 0;
  public stopCallCount = 0;
  public resetCallCount = 0;

  public shouldFailInit = false;
  public shouldFailStart = false;
  public shouldFailStop = false;
  public delayMs = 0;
  public delayInitMs = 0;
  public delayStartMs = 0;
  public delayStopMs = 0;

  private readonly _callLog?: MockServiceCallLog[];

  constructor(
    name: string,
    dependencies: readonly string[] = [],
    optionalDependencies: readonly string[] = [],
    callLog?: MockServiceCallLog[]
  ) {
    super();
    this.name = name;
    this.dependencies = dependencies;
    this.optionalDependencies = optionalDependencies;
    this._callLog = callLog;
  }

  protected override async onInitialize(): Promise<void> {
    this.initializeCallCount++;
    this._callLog?.push({ service: this.name, action: 'initialize', timestamp: Date.now() });
    const wait = this.delayInitMs || this.delayMs;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    if (this.shouldFailInit) {
      throw new Error(`Intentional init failure in ${this.name}`);
    }
  }

  protected override async onStart(): Promise<void> {
    this.startCallCount++;
    this._callLog?.push({ service: this.name, action: 'start', timestamp: Date.now() });
    const wait = this.delayStartMs || this.delayMs;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    if (this.shouldFailStart) {
      throw new Error(`Intentional start failure in ${this.name}`);
    }
  }

  protected override async onStop(): Promise<void> {
    this.stopCallCount++;
    this._callLog?.push({ service: this.name, action: 'stop', timestamp: Date.now() });
    const wait = this.delayStopMs || this.delayMs;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    if (this.shouldFailStop) {
      throw new Error(`Intentional stop failure in ${this.name}`);
    }
  }

  protected override async onReset(): Promise<void> {
    this.resetCallCount++;
    this._callLog?.push({ service: this.name, action: 'reset', timestamp: Date.now() });
  }

  // Allow manual override for testing edge states
  public forceStatus(status: ServiceStatus): void {
    this.setStatus(status);
  }
}
