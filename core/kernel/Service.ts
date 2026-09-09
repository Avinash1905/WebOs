/**
 * @file Service.ts
 * @description Standard SystemService interface and BaseSystemService abstract class for WebOS services.
 */

import type { ServiceStatus } from './types.js';

/**
 * Common contract that every WebOS core system service must implement.
 */
export interface SystemService {
  /**
   * Unique name of the service (e.g., 'eventbus', 'storage', 'filesystem', 'process').
   */
  readonly name: string;

  /**
   * List of names of required services that must be initialized and started before this service.
   */
  readonly dependencies?: readonly string[];

  /**
   * List of names of optional services. If present, they will be started before this service,
   * but startup will not fail if they are omitted.
   */
  readonly optionalDependencies?: readonly string[];

  /**
   * Gets the current lifecycle status of the service.
   */
  getStatus(): ServiceStatus;

  /**
   * Optional initialization phase.
   * Called once during Kernel initialization in dependency order.
   */
  initialize?(): Promise<void> | void;

  /**
   * Starts the service runtime.
   * Called after initialization in dependency order.
   */
  start?(): Promise<void> | void;

  /**
   * Stops the service runtime.
   * Called during Kernel shutdown in reverse dependency order.
   */
  stop?(): Promise<void> | void;

  /**
   * Optional reset phase called during Kernel restart before re-initialization.
   */
  reset?(): Promise<void> | void;
}

/**
 * Abstract base class for WebOS system services providing built-in lifecycle state management.
 * Custom services can extend this class or implement SystemService directly.
 */
export abstract class BaseSystemService implements SystemService {
  public abstract readonly name: string;
  public readonly dependencies?: readonly string[] = [];
  public readonly optionalDependencies?: readonly string[] = [];

  protected _status: ServiceStatus = 'REGISTERED';

  /**
   * Returns the current lifecycle status of this service.
   */
  public getStatus(): ServiceStatus {
    return this._status;
  }

  /**
   * Sets the internal lifecycle status of this service.
   */
  public setStatus(status: ServiceStatus): void {
    this._status = status;
  }

  /**
   * Initializes the service and updates status.
   */
  public async initialize(): Promise<void> {
    this._status = 'INITIALIZING';
    try {
      await this.onInitialize();
      this._status = 'INITIALIZED';
    } catch (error) {
      this._status = 'FAILED';
      throw error;
    }
  }

  /**
   * Starts the service and updates status.
   */
  public async start(): Promise<void> {
    this._status = 'STARTING';
    try {
      await this.onStart();
      this._status = 'RUNNING';
    } catch (error) {
      this._status = 'FAILED';
      throw error;
    }
  }

  /**
   * Stops the service and updates status.
   */
  public async stop(): Promise<void> {
    this._status = 'STOPPING';
    try {
      await this.onStop();
      this._status = 'STOPPED';
    } catch (error) {
      this._status = 'FAILED';
      throw error;
    }
  }

  /**
   * Resets the service back to REGISTERED or INITIALIZED state.
   */
  public async reset(): Promise<void> {
    await this.onReset();
    this._status = 'REGISTERED';
  }

  /**
   * Lifecycle hook to be overridden by subclasses for initialization logic.
   */
  protected async onInitialize(): Promise<void> {
    // Default no-op
  }

  /**
   * Lifecycle hook to be overridden by subclasses for startup logic.
   */
  protected async onStart(): Promise<void> {
    // Default no-op
  }

  /**
   * Lifecycle hook to be overridden by subclasses for shutdown logic.
   */
  protected async onStop(): Promise<void> {
    // Default no-op
  }

  /**
   * Lifecycle hook to be overridden by subclasses for reset logic.
   */
  protected async onReset(): Promise<void> {
    // Default no-op
  }
}
