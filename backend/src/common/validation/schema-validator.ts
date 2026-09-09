/**
 * WebOS Backend Foundation - Schema Validator Hook Factory
 */

import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { ZodError } from 'zod';
import type { RequestValidationSchema } from './types.js';
import { RequestValidationError } from './validation-error.js';

/**
 * Creates a preValidation hook for Fastify routes that validates request components
 */
export function validateRequest(schema: RequestValidationSchema) {
  return (request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction): void => {
    try {
      if (schema.params && request.params !== undefined) {
        request.params = schema.params.parse(request.params);
      }

      if (schema.query && request.query !== undefined) {
        request.query = schema.query.parse(request.query);
      }

      if (schema.body && request.body !== undefined) {
        request.body = schema.body.parse(request.body);
      }

      if (schema.headers && request.headers !== undefined) {
        // Headers are validated without overwriting default headers
        schema.headers.parse(request.headers);
      }

      done();
    } catch (error) {
      if (error instanceof ZodError) {
        done(RequestValidationError.fromZod(error));
      } else {
        done(error as Error);
      }
    }
  };
}
