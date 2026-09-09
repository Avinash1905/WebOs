/**
 * @file EventError.ts
 * @description Standardized error hierarchy for the WebOS Event Bus.
 */

/**
 * Base error class for all Event Bus errors.
 */
export class EventError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string = 'EVENT_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.name = 'EventError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an invalid or empty event type name is provided.
 */
export class InvalidEventTypeError extends EventError {
  public readonly eventType: unknown;

  constructor(eventType: unknown) {
    super(`Invalid event type: ${String(eventType)}. Event type must be a non-empty string.`, 'INVALID_EVENT_TYPE');
    this.name = 'InvalidEventTypeError';
    this.eventType = eventType;
  }
}

/**
 * Thrown when an invalid listener callback is provided.
 */
export class InvalidListenerError extends EventError {
  constructor(reason: string = 'Listener must be a function.') {
    super(`Invalid listener provided: ${reason}`, 'INVALID_LISTENER');
    this.name = 'InvalidListenerError';
  }
}

/**
 * Thrown when invalid configuration options are provided to EventBus.
 */
export class InvalidEventBusConfigError extends EventError {
  public readonly configKey: string;
  public readonly value: unknown;

  constructor(configKey: string, value: unknown, reason: string) {
    super(`Invalid EventBus configuration for '${configKey}': ${reason} (received ${String(value)})`, 'INVALID_CONFIG');
    this.name = 'InvalidEventBusConfigError';
    this.configKey = configKey;
    this.value = value;
  }
}

/**
 * Thrown when critical error occurs during event emission and error capture is disabled.
 */
export class EventEmissionError extends EventError {
  public readonly eventType: string;
  public readonly originalError: unknown;

  constructor(eventType: string, originalError: unknown) {
    const reason = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Error during emission of event '${eventType}': ${reason}`,
      'EVENT_EMISSION_ERROR',
      originalError instanceof Error ? { cause: originalError } : undefined
    );
    this.name = 'EventEmissionError';
    this.eventType = eventType;
    this.originalError = originalError;
  }
}
