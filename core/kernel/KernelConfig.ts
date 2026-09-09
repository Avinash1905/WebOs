/**
 * @file KernelConfig.ts
 * @description Configuration options and defaults for the WebOS Kernel runtime.
 */

/**
 * Custom logger interface supported by the Kernel.
 */
export interface KernelLogger {
  debug?(message: string, ...args: unknown[]): void;
  info?(message: string, ...args: unknown[]): void;
  warn?(message: string, ...args: unknown[]): void;
  error?(message: string, error?: unknown, ...args: unknown[]): void;
}

/**
 * Options for configuring the WebOS Kernel.
 */
export interface KernelConfig {
  /**
   * Maximum duration (in ms) allowed for any single service lifecycle phase (initialize, start, stop).
   * Set to 0 to disable timeouts. Defaults to 10000 (10 seconds).
   */
  readonly serviceTimeoutMs?: number;

  /**
   * Whether to automatically invoke `initialize()` if `start()` is called while the Kernel is in `CREATED` state.
   * Defaults to true.
   */
  readonly autoInitializeOnStart?: boolean;

  /**
   * Whether services can be registered or unregistered while the Kernel is running.
   * Defaults to false.
   */
  readonly allowHotRegistration?: boolean;

  /**
   * Custom logger implementation.
   */
  readonly logger?: KernelLogger;
}

/**
 * Default Kernel configuration settings.
 */
export const DEFAULT_KERNEL_CONFIG: Required<Omit<KernelConfig, 'logger'>> & { logger?: KernelLogger } = {
  serviceTimeoutMs: 10000,
  autoInitializeOnStart: true,
  allowHotRegistration: false,
  logger: undefined,
};

/**
 * Merges user-provided configuration with default Kernel configuration.
 *
 * @param userConfig - Optional partial configuration provided by the caller.
 * @returns Fully resolved Kernel configuration.
 */
export function resolveKernelConfig(userConfig?: KernelConfig): Required<Omit<KernelConfig, 'logger'>> & { logger?: KernelLogger } {
  return {
    serviceTimeoutMs: userConfig?.serviceTimeoutMs ?? DEFAULT_KERNEL_CONFIG.serviceTimeoutMs,
    autoInitializeOnStart: userConfig?.autoInitializeOnStart ?? DEFAULT_KERNEL_CONFIG.autoInitializeOnStart,
    allowHotRegistration: userConfig?.allowHotRegistration ?? DEFAULT_KERNEL_CONFIG.allowHotRegistration,
    logger: userConfig?.logger,
  };
}
