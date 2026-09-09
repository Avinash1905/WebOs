/**
 * @file FileSystemError.ts
 * @description Standardized error hierarchy for the WebOS Virtual File System.
 */

/**
 * Base error class for all WebOS FileSystem errors.
 */
export class FileSystemError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'FILESYSTEM_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.name = 'FileSystemError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a file does not exist at the requested path.
 */
export class FileNotFoundError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`File not found: '${path}'`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
    this.path = path;
  }
}

/**
 * Thrown when a directory does not exist at the requested path.
 */
export class DirectoryNotFoundError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`Directory not found: '${path}'`, 'DIRECTORY_NOT_FOUND');
    this.name = 'DirectoryNotFoundError';
    this.path = path;
  }
}

/**
 * Thrown when attempting to create a file that already exists without overwrite enabled.
 */
export class FileAlreadyExistsError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`File already exists: '${path}'`, 'FILE_ALREADY_EXISTS');
    this.name = 'FileAlreadyExistsError';
    this.path = path;
  }
}

/**
 * Thrown when attempting to create a directory that already exists.
 */
export class DirectoryAlreadyExistsError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`Directory already exists: '${path}'`, 'DIRECTORY_ALREADY_EXISTS');
    this.name = 'DirectoryAlreadyExistsError';
    this.path = path;
  }
}

/**
 * Thrown when a provided path string is invalid or attempts to escape the root sandbox.
 */
export class InvalidPathError extends FileSystemError {
  public readonly path: string;
  public readonly reason: string;

  constructor(path: string, reason: string) {
    super(`Invalid path '${path}': ${reason}`, 'INVALID_PATH');
    this.name = 'InvalidPathError';
    this.path = path;
    this.reason = reason;
  }
}

/**
 * Thrown when a file or directory name contains invalid characters or empty string.
 */
export class InvalidNameError extends FileSystemError {
  public readonly nodeName: string;
  public readonly reason: string;

  constructor(nodeName: string, reason: string) {
    super(`Invalid file or directory name '${nodeName}': ${reason}`, 'INVALID_NAME');
    this.name = 'InvalidNameError';
    this.nodeName = nodeName;
    this.reason = reason;
  }
}

/**
 * Thrown when an operation expected a directory node, but found a file node.
 */
export class NotADirectoryError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`Path is not a directory: '${path}'`, 'NOT_A_DIRECTORY');
    this.name = 'NotADirectoryError';
    this.path = path;
  }
}

/**
 * Thrown when an operation expected a file node, but found a directory node.
 */
export class IsADirectoryError extends FileSystemError {
  public readonly path: string;

  constructor(path: string) {
    super(`Path is a directory, not a file: '${path}'`, 'IS_A_DIRECTORY');
    this.name = 'IsADirectoryError';
    this.path = path;
  }
}

/**
 * Thrown when attempting an illegal operation on the root directory '/'.
 */
export class RootOperationError extends FileSystemError {
  public readonly operation: string;

  constructor(operation: string, reason: string = 'Root directory cannot be modified or deleted.') {
    super(`Cannot perform '${operation}' on root directory '/': ${reason}`, 'ROOT_OPERATION_ERROR');
    this.name = 'RootOperationError';
    this.operation = operation;
  }
}

/**
 * Thrown when a move or copy operation would introduce a circular directory cycle.
 */
export class DirectoryCycleError extends FileSystemError {
  public readonly sourcePath: string;
  public readonly destinationPath: string;

  constructor(sourcePath: string, destinationPath: string) {
    super(
      `Cannot move or copy directory '${sourcePath}' into its own descendant '${destinationPath}'.`,
      'DIRECTORY_CYCLE_ERROR'
    );
    this.name = 'DirectoryCycleError';
    this.sourcePath = sourcePath;
    this.destinationPath = destinationPath;
  }
}

/**
 * Thrown when an operation is disallowed by permissions or readonly flag.
 */
export class PermissionDeniedError extends FileSystemError {
  public readonly path: string;
  public readonly operation: string;

  constructor(path: string, operation: string, reason: string = 'Permission denied.') {
    super(`Permission denied for operation '${operation}' on '${path}': ${reason}`, 'PERMISSION_DENIED');
    this.name = 'PermissionDeniedError';
    this.path = path;
    this.operation = operation;
  }
}

/**
 * Thrown when storage engine operations fail during VFS read/write.
 */
export class StorageFailureError extends FileSystemError {
  public readonly operation: string;
  public readonly path: string;
  public readonly originalError: unknown;

  constructor(operation: string, path: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Storage failure during '${operation}' on '${path}': ${reason}`,
      'STORAGE_FAILURE',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageFailureError';
    this.operation = operation;
    this.path = path;
    this.originalError = originalError;
  }
}
