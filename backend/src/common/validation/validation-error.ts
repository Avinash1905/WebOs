/**
 * WebOS Backend Foundation - Validation Error Mapping
 */

import { ZodError } from 'zod';
import { ValidationError as BaseValidationError } from '../errors/specific-errors.js';
import type { ValidationIssue } from '../errors/specific-errors.js';

export class RequestValidationError extends BaseValidationError {
  public static fromZod(error: ZodError): RequestValidationError {
    const issues: ValidationIssue[] = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    const message = issues.length > 0
      ? `Validation failed: ${issues[0]?.message} at '${issues[0]?.path}'`
      : 'Validation failed';

    return new RequestValidationError(message, issues);
  }

  public static fromCustomIssues(issues: readonly ValidationIssue[]): RequestValidationError {
    const message = issues.length > 0
      ? `Validation failed: ${issues[0]?.message} at '${issues[0]?.path}'`
      : 'Validation failed';

    return new RequestValidationError(message, issues);
  }
}
