/**
 * WebOS Backend Foundation - Validation Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CommonSchemas, ValidationTypeGuards } from '../../src/common/validation/validation-utils.js';
import { RequestValidationError } from '../../src/common/validation/validation-error.js';
import { validateRequest } from '../../src/common/validation/schema-validator.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

describe('Validation Common Schemas & Type Guards', () => {
  it('should validate valid UUID with CommonSchemas.uuid', () => {
    const valid = '123e4567-e89b-12d3-a456-426614174000';
    expect(() => CommonSchemas.uuid.parse(valid)).not.toThrow();

    expect(() => CommonSchemas.uuid.parse('invalid-uuid')).toThrow();
  });

  it('should validate nonEmptyString', () => {
    const schema = CommonSchemas.nonEmptyString('Title');
    expect(schema.parse('  Valid Title  ')).toBe('Valid Title'); // Trims
    expect(() => schema.parse('   ')).toThrow();
  });

  it('should validate paginationQuery schema', () => {
    const parsed = CommonSchemas.paginationQuery.parse({
      page: '2',
      limit: '50'
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);
  });

  it('should correctly apply validation type guards', () => {
    expect(ValidationTypeGuards.isString('hello')).toBe(true);
    expect(ValidationTypeGuards.isString(123)).toBe(false);

    expect(ValidationTypeGuards.isNumber(42)).toBe(true);
    expect(ValidationTypeGuards.isNumber(NaN)).toBe(false);

    expect(ValidationTypeGuards.isObject({ a: 1 })).toBe(true);
    expect(ValidationTypeGuards.isObject(null)).toBe(false);
    expect(ValidationTypeGuards.isObject([1, 2])).toBe(false);

    expect(ValidationTypeGuards.isNonEmptyArray([1])).toBe(true);
    expect(ValidationTypeGuards.isNonEmptyArray([])).toBe(false);
  });
});

describe('validateRequest Hook', () => {
  const schema = {
    body: z.object({
      name: z.string().min(3),
      email: z.string().email()
    }),
    query: z.object({
      page: z.coerce.number().min(1)
    })
  };

  it('should pass valid request data through hook', () => {
    const hook = validateRequest(schema);
    const mockRequest = {
      body: { name: 'Alice', email: 'alice@webos.io' },
      query: { page: '1' }
    } as unknown as FastifyRequest;

    let errorResult: unknown = null;
    hook(mockRequest, {} as FastifyReply, (err) => {
      errorResult = err;
    });

    expect(errorResult).toBeUndefined();
    expect((mockRequest.query as { page: number }).page).toBe(1); // Coerced to number
  });

  it('should pass RequestValidationError on invalid request body', () => {
    const hook = validateRequest(schema);
    const mockRequest = {
      body: { name: 'Al', email: 'not-an-email' },
      query: { page: '1' }
    } as unknown as FastifyRequest;

    let errorResult: unknown = null;
    hook(mockRequest, {} as FastifyReply, (err) => {
      errorResult = err;
    });

    expect(errorResult).toBeInstanceOf(RequestValidationError);
    const valErr = errorResult as RequestValidationError;
    expect(valErr.statusCode).toBe(400);
    expect(Array.isArray(valErr.details)).toBe(true);
  });
});
