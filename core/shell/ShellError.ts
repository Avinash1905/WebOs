/**
 * @file ShellError.ts
 * @description Exception hierarchy for the WebOS Shell subsystem.
 */

export class ShellError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'SHELL_ERROR') {
    super(message);
    this.name = 'ShellError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CommandNotFoundError extends ShellError {
  public readonly command: string;

  constructor(command: string) {
    super(`Command not found: ${command}`, 'COMMAND_NOT_FOUND');
    this.name = 'CommandNotFoundError';
    this.command = command;
  }
}

export class InvalidCommandSyntaxError extends ShellError {
  constructor(message: string) {
    super(`Syntax error: ${message}`, 'INVALID_COMMAND_SYNTAX');
    this.name = 'InvalidCommandSyntaxError';
  }
}

export class CommandExecutionError extends ShellError {
  public readonly command: string;
  public readonly exitCode: number;

  constructor(command: string, message: string, exitCode = 1) {
    super(`Error executing '${command}': ${message}`, 'COMMAND_EXECUTION_ERROR');
    this.name = 'CommandExecutionError';
    this.command = command;
    this.exitCode = exitCode;
  }
}

export class CommandPermissionError extends ShellError {
  constructor(action: string, target?: string) {
    super(
      target
        ? `Permission denied: cannot perform '${action}' on '${target}'`
        : `Permission denied for action '${action}'`,
      'COMMAND_PERMISSION_DENIED'
    );
    this.name = 'CommandPermissionError';
  }
}
