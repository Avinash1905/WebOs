/**
 * @file UserError.ts
 * @description Typed error hierarchy for the Local User and Session System.
 */

export class UserError extends Error {
  public override readonly name: string = 'UserError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserNotFoundError extends UserError {
  public override readonly name = 'UserNotFoundError';

  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

export class UserAlreadyExistsError extends UserError {
  public override readonly name = 'UserAlreadyExistsError';

  constructor(username: string) {
    super(`User with username '${username}' already exists`);
  }
}

export class InvalidUsernameError extends UserError {
  public override readonly name = 'InvalidUsernameError';

  constructor(username: string, reason?: string) {
    super(`Invalid username '${username}'${reason ? `: ${reason}` : ''}`);
  }
}

export class ProtectedUserError extends UserError {
  public override readonly name = 'ProtectedUserError';

  constructor(username: string) {
    super(`Cannot modify or delete protected system user: ${username}`);
  }
}

export class SessionNotFoundError extends UserError {
  public override readonly name = 'SessionNotFoundError';

  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
  }
}

export class InvalidSessionError extends UserError {
  public override readonly name = 'InvalidSessionError';

  constructor(reason: string) {
    super(`Invalid session: ${reason}`);
  }
}

export class SessionExpiredError extends UserError {
  public override readonly name = 'SessionExpiredError';

  constructor(sessionId: string) {
    super(`Session '${sessionId}' has expired`);
  }
}
