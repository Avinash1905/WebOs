/**
 * @file BuiltinServices.ts
 * @description Adapters exposing existing WebOS core modules as SystemService instances.
 */

import type { BaseSystemService as KernelBaseSystemService } from '../kernel/index.js';
import { ManagedSystemService } from './BaseSystemService.js';
import type { ServiceHealthInfo } from './types.js';

export class KernelServiceAdapter extends ManagedSystemService {
  public override readonly id: string;
  public override readonly name: string;
  public override readonly description?: string;
  public override readonly version: string;
  public override readonly dependencies: readonly string[];
  public override readonly optionalDependencies: readonly string[];
  public override readonly autoStart: boolean;

  private readonly _kernelService: KernelBaseSystemService;

  constructor(
    id: string,
    name: string,
    kernelService: KernelBaseSystemService,
    options?: {
      description?: string;
      version?: string;
      dependencies?: readonly string[];
      optionalDependencies?: readonly string[];
      autoStart?: boolean;
    }
  ) {
    super();
    this.id = id;
    this.name = name;
    this._kernelService = kernelService;
    this.description = options?.description ?? `WebOS Core Service: ${name}`;
    this.version = options?.version ?? '1.0.0';
    this.dependencies = options?.dependencies ?? kernelService.dependencies ?? [];
    this.optionalDependencies = options?.optionalDependencies ?? kernelService.optionalDependencies ?? [];
    this.autoStart = options?.autoStart ?? true;
  }

  public getUnderlyingService<T extends KernelBaseSystemService>(): T {
    return this._kernelService as T;
  }

  protected override async onInitialize(): Promise<void> {
    if (this._kernelService.initialize) {
      await this._kernelService.initialize();
    }
  }

  protected override async onStart(): Promise<void> {
    if (this._kernelService.start) {
      await this._kernelService.start();
    }
  }

  protected override async onStop(): Promise<void> {
    if (this._kernelService.stop) {
      await this._kernelService.stop();
    }
  }

  protected override onHealthCheck(): ServiceHealthInfo {
    const kStatus = this._kernelService.getStatus();
    const healthStatus = kStatus === 'RUNNING' ? 'HEALTHY' : kStatus === 'FAILED' ? 'UNHEALTHY' : 'UNKNOWN';
    return {
      status: healthStatus,
      message: `Status: ${kStatus}`,
      lastCheckedAt: Date.now(),
      uptimeMs: kStatus === 'RUNNING' ? this.healthTracker.getHealth().uptimeMs : 0,
      errorCount: this.healthTracker.getHealth().errorCount,
    };
  }
}
