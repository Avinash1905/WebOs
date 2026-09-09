/**
 * WebOS Backend Foundation - Environment Diagnostics & Validator
 */

import { ZodError } from 'zod';
import { parseConfig } from './config.schema.js';
import type { AppConfig, RawEnv } from './config.types.js';

export class ConfigurationError extends Error {
  public readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super(message);
    this.name = 'ConfigurationError';
    this.issues = issues;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export function validateAndLoadConfig(rawEnv: RawEnv): AppConfig {
  try {
    return parseConfig(rawEnv);
  } catch (error) {
    if (error instanceof ZodError) {
      const issueDetails = error.issues.map((issue) => {
        const field = issue.path.join('.');
        return `  - [${field}]: ${issue.message}`;
      });

      const formattedMessage = [
        'Invalid Backend Configuration:',
        ...issueDetails,
        'Please check your .env file or environment variables against .env.example.'
      ].join('\n');

      throw new ConfigurationError(formattedMessage, issueDetails);
    }
    throw error;
  }
}
