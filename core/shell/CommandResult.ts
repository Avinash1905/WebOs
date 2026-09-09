/**
 * @file CommandResult.ts
 * @description Factory helpers for creating standardized CommandResult objects.
 */

import type { CommandResult } from './types.js';

export class CommandResultBuilder {
  public static success(output = '', exitCode = 0, durationMs?: number): CommandResult {
    return {
      success: true,
      output,
      error: null,
      exitCode,
      executionTimeMs: durationMs,
    };
  }

  public static error(error: string, exitCode = 1, output = '', durationMs?: number): CommandResult {
    return {
      success: false,
      output,
      error,
      exitCode,
      executionTimeMs: durationMs,
    };
  }
}
