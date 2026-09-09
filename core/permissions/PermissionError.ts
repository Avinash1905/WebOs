/**
 * @file PermissionError.ts
 * @description Typed error hierarchy for the WebOS Permission & Security Engine.
 */

export class PermissionError extends Error {
  public override readonly name: string = 'PermissionError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PermissionDeniedError extends PermissionError {
  public override readonly name = 'PermissionDeniedError';
  public readonly target: string;
  public readonly permission: string;
  public readonly userId?: string;

  constructor(target: string, permission: string, userId?: string, reason?: string) {
    super(
      `Permission denied: User '${userId ?? 'anonymous'}' cannot '${permission}' on '${target}'${
        reason ? ` (${reason})` : ''
      }`
    );
    this.target = target;
    this.permission = permission;
    this.userId = userId;
  }
}

export class InvalidPermissionError extends PermissionError {
  public override readonly name = 'InvalidPermissionError';

  constructor(message: string) {
    super(`Invalid permission: ${message}`);
  }
}

export class UnauthorizedOperationError extends PermissionError {
  public override readonly name = 'UnauthorizedOperationError';

  constructor(operation: string, reason?: string) {
    super(`Unauthorized operation '${operation}'${reason ? `: ${reason}` : ''}`);
  }
}

export class SecurityViolationError extends PermissionError {
  public override readonly name = 'SecurityViolationError';
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ) {
    super(`Security violation [${severity.toUpperCase()}]: ${description}`);
    this.severity = severity;
  }
}
