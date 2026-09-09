/**
 * @file ApplicationError.ts
 * @description Error hierarchy for Application Runtime and Lifecycle Management.
 */

export class ApplicationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'APPLICATION_ERROR') {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AppNotFoundError extends ApplicationError {
  constructor(appId: string) {
    super(`Application '${appId}' was not found in registry`, 'APP_NOT_FOUND');
    this.name = 'AppNotFoundError';
  }
}

export class AppAlreadyRegisteredError extends ApplicationError {
  constructor(appId: string) {
    super(`Application '${appId}' is already registered`, 'APP_ALREADY_REGISTERED');
    this.name = 'AppAlreadyRegisteredError';
  }
}

export class InvalidManifestError extends ApplicationError {
  constructor(reason: string) {
    super(`Invalid application manifest: ${reason}`, 'INVALID_MANIFEST');
    this.name = 'InvalidManifestError';
  }
}

export class AppLaunchError extends ApplicationError {
  constructor(appId: string, reason: string) {
    super(`Failed to launch application '${appId}': ${reason}`, 'APP_LAUNCH_ERROR');
    this.name = 'AppLaunchError';
  }
}

export class AppPermissionError extends ApplicationError {
  constructor(appId: string, permission: string) {
    super(`Application '${appId}' does not have required permission: '${permission}'`, 'APP_PERMISSION_DENIED');
    this.name = 'AppPermissionError';
  }
}

export class AppAlreadyRunningError extends ApplicationError {
  public readonly existingInstanceId: string;

  constructor(appId: string, instanceId: string) {
    super(`Application '${appId}' is single-instance and already running (instance: ${instanceId})`, 'APP_ALREADY_RUNNING');
    this.name = 'AppAlreadyRunningError';
    this.existingInstanceId = instanceId;
  }
}

export class AppCrashError extends ApplicationError {
  public readonly error: Error | unknown;

  constructor(appId: string, instanceId: string, originalError: Error | unknown) {
    const errMsg = originalError instanceof Error ? originalError.message : String(originalError);
    super(`Application '${appId}' (instance: ${instanceId}) crashed: ${errMsg}`, 'APP_CRASH');
    this.name = 'AppCrashError';
    this.error = originalError;
  }
}
