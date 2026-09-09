/**
 * @file ClipboardError.ts
 * @description Typed error hierarchy for the WebOS Clipboard System.
 */

export class ClipboardError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'CLIPBOARD_ERROR') {
    super(message);
    this.name = 'ClipboardError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class EmptyClipboardError extends ClipboardError {
  constructor(message = 'Clipboard is empty') {
    super(message, 'EMPTY_CLIPBOARD');
    this.name = 'EmptyClipboardError';
  }
}

export class InvalidClipboardDataError extends ClipboardError {
  constructor(details: string) {
    super('Invalid clipboard data: ' + details, 'INVALID_CLIPBOARD_DATA');
    this.name = 'InvalidClipboardDataError';
  }
}

export class ClipboardPermissionError extends ClipboardError {
  public readonly permission: string;
  public readonly userId?: string;

  constructor(permission: string, userId?: string, reason?: string) {
    super(
      'Clipboard permission denied for \'' + permission + '\'' +
        (userId ? ' (user: ' + userId + ')' : '') +
        (reason ? ': ' + reason : ''),
      'CLIPBOARD_PERMISSION_DENIED'
    );
    this.name = 'ClipboardPermissionError';
    this.permission = permission;
    this.userId = userId;
  }
}

export class ClipboardOperationError extends ClipboardError {
  public readonly operation: string;

  constructor(operation: string, details: string) {
    super('Clipboard operation \'' + operation + '\' failed: ' + details, 'CLIPBOARD_OPERATION_FAILED');
    this.name = 'ClipboardOperationError';
    this.operation = operation;
  }
}
