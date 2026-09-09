/**
 * @file ServiceError.ts
 * @description Error hierarchy for WebOS System Services Subsystem.
 */

export class ServiceError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ServiceNotFoundError extends ServiceError {
  constructor(serviceId: string) {
    super(`Service '${serviceId}' was not found in ServiceRegistry`, 'SERVICE_NOT_FOUND');
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceAlreadyRegisteredError extends ServiceError {
  constructor(serviceId: string) {
    super(`Service '${serviceId}' is already registered`, 'SERVICE_ALREADY_REGISTERED');
    this.name = 'ServiceAlreadyRegisteredError';
  }
}

export class ServiceStateError extends ServiceError {
  constructor(serviceId: string, current: string, expected: string) {
    super(`Service '${serviceId}' is in state '${current}', expected '${expected}'`, 'SERVICE_STATE_ERROR');
    this.name = 'ServiceStateError';
  }
}

export class ServiceDependencyError extends ServiceError {
  constructor(message: string) {
    super(message, 'SERVICE_DEPENDENCY_ERROR');
    this.name = 'ServiceDependencyError';
  }
}

export class MissingServiceDependencyError extends ServiceDependencyError {
  constructor(serviceId: string, missing: string) {
    super(`Service '${serviceId}' requires missing dependency '${missing}'`);
    this.name = 'MissingServiceDependencyError';
  }
}

export class CircularServiceDependencyError extends ServiceDependencyError {
  constructor(cycle: string[]) {
    super(`Circular dependency detected in system services: ${cycle.join(' -> ')}`);
    this.name = 'CircularServiceDependencyError';
  }
}

export class ServiceStartupError extends ServiceError {
  public readonly originalError?: unknown;

  constructor(serviceId: string, reason: string, originalError?: unknown) {
    super(`Failed to start service '${serviceId}': ${reason}`, 'SERVICE_STARTUP_ERROR');
    this.name = 'ServiceStartupError';
    this.originalError = originalError;
  }
}

export class ServiceShutdownError extends ServiceError {
  public readonly originalError?: unknown;

  constructor(serviceId: string, reason: string, originalError?: unknown) {
    super(`Failed to cleanly stop service '${serviceId}': ${reason}`, 'SERVICE_SHUTDOWN_ERROR');
    this.name = 'ServiceShutdownError';
    this.originalError = originalError;
  }
}
