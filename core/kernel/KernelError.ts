/**
 * @file KernelError.ts
 * @description Standardized error hierarchy for the WebOS Kernel and service runtime.
 */

import type { KernelStatus } from './types.js';

/**
 * Base error class for all WebOS Kernel errors.
 */
export class KernelError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'KERNEL_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.name = 'KernelError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when attempting to register a service whose name is already registered.
 */
export class ServiceAlreadyRegisteredError extends KernelError {
  public readonly serviceName: string;

  constructor(serviceName: string) {
    super(`Service '${serviceName}' is already registered in the Kernel.`, 'SERVICE_ALREADY_REGISTERED');
    this.name = 'ServiceAlreadyRegisteredError';
    this.serviceName = serviceName;
  }
}

/**
 * Thrown when requesting or operating on a service that is not registered.
 */
export class ServiceNotFoundError extends KernelError {
  public readonly serviceName: string;

  constructor(serviceName: string) {
    super(`Service '${serviceName}' was not found in the Kernel registry.`, 'SERVICE_NOT_FOUND');
    this.name = 'ServiceNotFoundError';
    this.serviceName = serviceName;
  }
}

/**
 * Thrown when a service requires another service dependency that is not registered.
 */
export class MissingDependencyError extends KernelError {
  public readonly serviceName: string;
  public readonly missingDependency: string;

  constructor(serviceName: string, missingDependency: string) {
    super(
      `Service '${serviceName}' depends on missing service '${missingDependency}'.`,
      'MISSING_DEPENDENCY'
    );
    this.name = 'MissingDependencyError';
    this.serviceName = serviceName;
    this.missingDependency = missingDependency;
  }
}

/**
 * Thrown when a cyclic dependency is detected among registered services.
 */
export class CircularDependencyError extends KernelError {
  public readonly cycle: readonly string[];

  constructor(cycle: readonly string[]) {
    const cycleStr = cycle.join(' -> ');
    super(
      `Circular dependency detected: ${cycleStr}`,
      'CIRCULAR_DEPENDENCY'
    );
    this.name = 'CircularDependencyError';
    this.cycle = cycle;
  }
}

/**
 * Thrown when an invalid lifecycle transition or operation is attempted on the Kernel.
 */
export class InvalidKernelStateError extends KernelError {
  public readonly currentStatus: KernelStatus;
  public readonly attemptedAction: string;

  constructor(currentStatus: KernelStatus, attemptedAction: string) {
    super(
      `Cannot perform action '${attemptedAction}' when Kernel is in state '${currentStatus}'.`,
      'INVALID_KERNEL_STATE'
    );
    this.name = 'InvalidKernelStateError';
    this.currentStatus = currentStatus;
    this.attemptedAction = attemptedAction;
  }
}

/**
 * Thrown when a service fails during its initialize() phase.
 */
export class ServiceInitializationError extends KernelError {
  public readonly serviceName: string;
  public readonly originalError: unknown;

  constructor(serviceName: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Failed to initialize service '${serviceName}': ${reason}`,
      'SERVICE_INITIALIZATION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'ServiceInitializationError';
    this.serviceName = serviceName;
    this.originalError = originalError;
  }
}

/**
 * Thrown when a service fails during its start() phase.
 */
export class ServiceStartupError extends KernelError {
  public readonly serviceName: string;
  public readonly originalError: unknown;

  constructor(serviceName: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Failed to start service '${serviceName}': ${reason}`,
      'SERVICE_STARTUP_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'ServiceStartupError';
    this.serviceName = serviceName;
    this.originalError = originalError;
  }
}

/**
 * Thrown when a service fails during its stop() phase.
 */
export class ServiceShutdownError extends KernelError {
  public readonly serviceName: string;
  public readonly originalError: unknown;

  constructor(serviceName: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Failed to stop service '${serviceName}': ${reason}`,
      'SERVICE_SHUTDOWN_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'ServiceShutdownError';
    this.serviceName = serviceName;
    this.originalError = originalError;
  }
}

/**
 * Thrown when a service operation exceeds the configured timeout duration.
 */
export class KernelTimeoutError extends KernelError {
  public readonly operation: string;
  public readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms.`,
      'KERNEL_TIMEOUT_ERROR'
    );
    this.name = 'KernelTimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}
