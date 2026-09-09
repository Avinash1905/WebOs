/**
 * WebOS Backend Foundation - Unknown Route 404 Handler
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { RouteNotFoundError } from './specific-errors.js';
import { serializeError } from './error-serializer.js';
import { HttpStatus } from '../types/http.types.js';

export function createNotFoundHandler(isProduction: boolean) {
  return function notFoundHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): void {
    const requestId = request.id || 'unknown-req';
    const error = new RouteNotFoundError(request.method, request.url);

    request.log.info(
      {
        requestId,
        method: request.method,
        url: request.url
      },
      `Route not found: ${request.method} ${request.url}`
    );

    const payload = serializeError(error, {
      requestId,
      isProduction
    });

    reply.status(HttpStatus.NOT_FOUND).type('application/json').send(payload);
  };
}
