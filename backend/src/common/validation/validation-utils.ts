/**
 * WebOS Backend Foundation - Validation Utilities & Common Field Schemas
 */

import { z } from 'zod';

export const CommonSchemas = {
  /**
   * Valid RFC 4122 UUID v4
   */
  uuid: z.string().uuid('Must be a valid UUID v4'),

  /**
   * Non-empty trimmed string
   */
  nonEmptyString: (fieldName = 'Field') =>
    z.string().trim().min(1, `${fieldName} cannot be empty`),

  /**
   * Positive integer
   */
  positiveInt: (fieldName = 'Value') =>
    z.coerce.number().int(`${fieldName} must be an integer`).positive(`${fieldName} must be positive`),

  /**
   * Standard pagination query schema
   */
  paginationQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional()
  }),

  /**
   * Standard identifier path parameter schema
   */
  idParam: z.object({
    id: z.string().min(1, 'Identifier parameter cannot be empty')
  })
} as const;

export const ValidationTypeGuards = {
  isString(val: unknown): val is string {
    return typeof val === 'string';
  },

  isNumber(val: unknown): val is number {
    return typeof val === 'number' && !isNaN(val);
  },

  isObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  },

  isNonEmptyArray<T>(val: unknown): val is [T, ...T[]] {
    return Array.isArray(val) && val.length > 0;
  }
} as const;
