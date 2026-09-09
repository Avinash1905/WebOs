/**
 * @file ResourceError.ts
 * @description Error hierarchy for WebOS Resource Manager Subsystem.
 */

export class ResourceError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'RESOURCE_ERROR') {
    super(message);
    this.name = 'ResourceError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ResourceLimitExceededError extends ResourceError {
  public readonly resourceType: string;
  public readonly limit: number;
  public readonly current: number;

  constructor(resourceType: string, limit: number, current: number) {
    super(
      `Resource limit exceeded for '${resourceType}': current ${current}, limit ${limit}`,
      'RESOURCE_LIMIT_EXCEEDED'
    );
    this.name = 'ResourceLimitExceededError';
    this.resourceType = resourceType;
    this.limit = limit;
    this.current = current;
  }
}

export class ResourceMonitorError extends ResourceError {
  constructor(reason: string) {
    super(`Resource monitor error: ${reason}`, 'RESOURCE_MONITOR_ERROR');
    this.name = 'ResourceMonitorError';
  }
}
