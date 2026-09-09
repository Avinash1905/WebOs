/**
 * WebOS Backend Foundation - Response Envelope Middleware & Helpers
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { HttpStatus, type HttpStatusCode } from '../types/http.types.js';

export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data
  };
}

const responsePlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.decorateReply('sendSuccess', function <T>(
    this: FastifyReply,
    data: T,
    statusCode: HttpStatusCode = HttpStatus.OK
  ) {
    return this.status(statusCode).type('application/json').send(createSuccessResponse(data));
  });
};

export const registerResponseEnvelope = fp(responsePlugin, {
  name: 'webos-response-envelope',
  fastify: '4.x'
});
