/**
 * @file StorageError.ts
 * @description Standardized error hierarchy for the WebOS Storage Engine.
 */

/**
 * Base error class for all WebOS storage errors.
 */
export class StorageError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'STORAGE_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the storage adapter fails to initialize.
 */
export class StorageInitializationError extends StorageError {
  public readonly adapterName: string;
  public readonly originalError: unknown;

  constructor(adapterName: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Failed to initialize storage adapter '${adapterName}': ${reason}`,
      'STORAGE_INITIALIZATION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageInitializationError';
    this.adapterName = adapterName;
    this.originalError = originalError;
  }
}

/**
 * Thrown when connection to the underlying storage fails or is closed.
 */
export class StorageConnectionError extends StorageError {
  public readonly operation: string;

  constructor(operation: string, originalError?: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError ?? 'Connection closed');
    super(
      `Storage connection error during operation '${operation}': ${reason}`,
      'STORAGE_CONNECTION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageConnectionError';
    this.operation = operation;
  }
}

/**
 * Thrown when reading from storage fails.
 */
export class StorageReadError extends StorageError {
  public readonly key: string;
  public readonly namespace?: string;

  constructor(key: string, namespace?: string, originalError?: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError ?? 'Unknown read error');
    const nsPrefix = namespace ? `[${namespace}] ` : '';
    super(
      `Failed to read storage key '${nsPrefix}${key}': ${reason}`,
      'STORAGE_READ_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageReadError';
    this.key = key;
    this.namespace = namespace;
  }
}

/**
 * Thrown when writing to storage fails.
 */
export class StorageWriteError extends StorageError {
  public readonly key: string;
  public readonly namespace?: string;

  constructor(key: string, namespace?: string, originalError?: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError ?? 'Unknown write error');
    const nsPrefix = namespace ? `[${namespace}] ` : '';
    super(
      `Failed to write storage key '${nsPrefix}${key}': ${reason}`,
      'STORAGE_WRITE_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageWriteError';
    this.key = key;
    this.namespace = namespace;
  }
}

/**
 * Thrown when deleting from storage fails.
 */
export class StorageDeleteError extends StorageError {
  public readonly key: string;
  public readonly namespace?: string;

  constructor(key: string, namespace?: string, originalError?: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError ?? 'Unknown delete error');
    const nsPrefix = namespace ? `[${namespace}] ` : '';
    super(
      `Failed to delete storage key '${nsPrefix}${key}': ${reason}`,
      'STORAGE_DELETE_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageDeleteError';
    this.key = key;
    this.namespace = namespace;
  }
}

/**
 * Thrown when storage quota is exceeded.
 */
export class StorageQuotaError extends StorageError {
  public readonly usedBytes?: number;
  public readonly maxBytes?: number;

  constructor(usedBytes?: number, maxBytes?: number, reason: string = 'Storage quota exceeded.') {
    super(
      `Storage quota error: ${reason} (used: ${usedBytes ?? 'unknown'}, max: ${maxBytes ?? 'unknown'})`,
      'STORAGE_QUOTA_ERROR'
    );
    this.name = 'StorageQuotaError';
    this.usedBytes = usedBytes;
    this.maxBytes = maxBytes;
  }
}

/**
 * Thrown when a value cannot be serialized or deserialized.
 */
export class StorageSerializationError extends StorageError {
  public readonly valueType: string;

  constructor(valueType: string, reason: string, originalError?: unknown) {
    super(
      `Serialization error for type '${valueType}': ${reason}`,
      'STORAGE_SERIALIZATION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageSerializationError';
    this.valueType = valueType;
  }
}

/**
 * Thrown when an atomic storage transaction fails or cannot be committed.
 */
export class StorageTransactionError extends StorageError {
  public readonly operation: string;

  constructor(operation: string, reason: string, originalError?: unknown) {
    super(
      `Storage transaction error during '${operation}': ${reason}`,
      'STORAGE_TRANSACTION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageTransactionError';
    this.operation = operation;
  }
}

/**
 * Thrown when storage recovery fails.
 */
export class StorageRecoveryError extends StorageError {
  public readonly phase: string;

  constructor(phase: string, reason: string, originalError?: unknown) {
    super(
      `Storage recovery failed at phase '${phase}': ${reason}`,
      'STORAGE_RECOVERY_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'StorageRecoveryError';
    this.phase = phase;
  }
}
