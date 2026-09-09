/**
 * @file KernelConfigValidator.ts
 * @description Schema validation and dynamic environment property checks for Kernel configuration.
 */

import { KernelConfigError } from './KernelError.js';
import type { KernelConfig } from './KernelConfig.js';

export class KernelConfigValidator {
  public static validate(config: KernelConfig): void {
    if (config.serviceTimeoutMs !== undefined) {
      if (typeof config.serviceTimeoutMs !== 'number' || isNaN(config.serviceTimeoutMs) || config.serviceTimeoutMs < 0) {
        throw new KernelConfigError('serviceTimeoutMs must be a non-negative number');
      }
      if (config.serviceTimeoutMs > 300000) {
        throw new KernelConfigError('serviceTimeoutMs cannot exceed 300,000ms (5 minutes)');
      }
    }
  }

  public static sanitize(config?: Partial<KernelConfig>): KernelConfig {
    const raw = config ?? {};
    this.validate(raw as KernelConfig);
    return {
      serviceTimeoutMs: raw.serviceTimeoutMs ?? 10000,
      autoInitializeOnStart: raw.autoInitializeOnStart ?? true,
      allowHotRegistration: raw.allowHotRegistration ?? false,
      logger: raw.logger,
    };
  }
}
