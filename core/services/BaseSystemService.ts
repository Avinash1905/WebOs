/**
 * @file BaseSystemService.ts
 * @description Abstract base class for reusable background System Services.
 */

import { ServiceHealthTracker } from './ServiceHealth.js';
import { assertTransition } from './ServiceState.js';
import type {
  ServiceHealthInfo,
  ServiceState,
  SystemService,
} from './types.js';

export abstract class ManagedSystemService implements SystemService {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public readonly description?: string;
  public readonly version: string = '1.0.0';
  public readonly dependencies: readonly string[] = [];
  public readonly optionalDependencies: readonly string[] = [];
  public readonly autoStart: boolean = true;

  private _state: ServiceState = 'REGISTERED';
  protected readonly healthTracker = new ServiceHealthTracker();

  public getStatus(): ServiceState {
    return this._state;
  }

  public getHealth(): Promise<ServiceHealthInfo> | ServiceHealthInfo {
    return this.onHealthCheck();
  }

  public async initialize(): Promise<void> {
    if (this._state === 'INITIALIZED' || this._state === 'RUNNING') return;
    this.setState('INITIALIZING');
    try {
      await this.onInitialize();
      this.setState('INITIALIZED');
    } catch (err: any) {
      this.healthTracker.recordError(err);
      this.setState('FAILED');
      throw err;
    }
  }

  public async start(): Promise<void> {
    if (this._state === 'RUNNING') return;
    if (this._state === 'REGISTERED') {
      await this.initialize();
    }
    this.setState('STARTING');
    try {
      await this.onStart();
      this.healthTracker.recordStart();
      this.setState('RUNNING');
    } catch (err: any) {
      this.healthTracker.recordError(err);
      this.setState('FAILED');
      throw err;
    }
  }

  public async stop(): Promise<void> {
    if (this._state === 'STOPPED') return;
    this.setState('STOPPING');
    try {
      await this.onStop();
      this.healthTracker.recordStop();
      this.setState('STOPPED');
    } catch (err: any) {
      this.healthTracker.recordError(err);
      this.setState('FAILED');
      throw err;
    }
  }

  public async pause(): Promise<void> {
    if (this._state !== 'RUNNING') return;
    this.setState('PAUSED');
    await this.onPause();
  }

  public async resume(): Promise<void> {
    if (this._state !== 'PAUSED') return;
    this.setState('RUNNING');
    await this.onResume();
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public async reset(): Promise<void> {
    await this.stop();
    this.healthTracker.reset();
    await this.onReset();
    this.setState('REGISTERED');
  }

  protected setState(newState: ServiceState): void {
    assertTransition(this.id, this._state, newState);
    this._state = newState;
  }

  protected async onInitialize(): Promise<void> {}
  protected async onStart(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onPause(): Promise<void> {}
  protected async onResume(): Promise<void> {}
  protected async onReset(): Promise<void> {}
  protected onHealthCheck(): ServiceHealthInfo {
    return this.healthTracker.getHealth();
  }
}
