/**
 * WebOS Backend Foundation - Content-Type & Payload Guard
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';
import { HttpStatus } from '../types/http.types.js';

const contentTypePlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preValidation', (request: FastifyRequest, _reply: FastifyReply, done) => {
    const method = request.method.toUpperCase();
    const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

    if (hasBody && request.body !== undefined && request.body !== null) {
      const contentType = request.headers['content-type'];
      if (!contentType) {
        return done(
          new AppError('Content-Type header is required for requests with a body', {
            code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
            statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE
          })
        );
      }
    }
    done();
  });
};

export const registerContentTypeGuard = fp(contentTypePlugin, {
  name: 'webos-content-type-guard',
  fastify: '4.x'
});
