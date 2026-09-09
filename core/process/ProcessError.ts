/**
 * @file ProcessError.ts
 * @description Typed error hierarchy for the WebOS Process Management Subsystem.
 */

export class ProcessError extends Error {
  public override readonly name: string = 'ProcessError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProcessNotFoundError extends ProcessError {
  public override readonly name = 'ProcessNotFoundError';

  constructor(pid: number | string) {
    super(`Process with PID ${pid} not found`);
  }
}

export class InvalidProcessStateError extends ProcessError {
  public override readonly name = 'InvalidProcessStateError';

  constructor(pid: number, currentState: string, targetState: string, reason?: string) {
    super(
      `Cannot transition process PID ${pid} from ${currentState} to ${targetState}${
        reason ? `: ${reason}` : ''
      }`
    );
  }
}

export class PidAllocationError extends ProcessError {
  public override readonly name = 'PidAllocationError';

  constructor(message: string) {
    super(`PID Allocation failed: ${message}`);
  }
}

export class ProcessPermissionError extends ProcessError {
  public override readonly name = 'ProcessPermissionError';

  constructor(pid: number, userId: string, action: string) {
    super(
      `User '${userId}' does not have permission to '${action}' process PID ${pid}`
    );
  }
}
