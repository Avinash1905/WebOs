/**
 * @file ProcessTimeSlice.ts
 * @description Time slice calculator for WebOS processes.
 */

import type { ProcessPriority } from '../process/index.js';
import { PriorityHelper } from './ProcessPriority.js';
import type { ResolvedSchedulerConfig } from './types.js';

export class ProcessTimeSlice {
  private readonly _config: ResolvedSchedulerConfig;

  constructor(config: ResolvedSchedulerConfig) {
    this._config = config;
  }

  public calculateSlice(priority: ProcessPriority): number {
    const multiplier = PriorityHelper.getSliceMultiplier(priority);
    const calculated = Math.round(this._config.defaultTimeSliceMs * multiplier);
    return Math.max(
      this._config.minTimeSliceMs,
      Math.min(this._config.maxTimeSliceMs, calculated)
    );
  }
}
