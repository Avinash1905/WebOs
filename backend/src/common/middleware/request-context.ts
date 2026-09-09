/**
 * WebOS Backend Foundation - Request Context Middleware
 * Decorates each FastifyRequest with strongly-typed RequestContext and propagates Request IDs.
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { IdUtils } from '../utils/id.js';
import { TimeUtils } from '../utils/time.js';
import { HttpHeader } from '../types/http.types.js';
import type { RequestContext } from '../types/context.types.js';
import type { HttpMethod } from '../types/http.types.js';
import { LogContext } from '../logging/log-context.js';

const requestContextPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Decorate FastifyRequest prototype with requestContext
  app.decorateRequest('requestContext', null);

  app.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
    const rawRequestId = request.headers[HttpHeader.X_REQUEST_ID] as string | undefined;
    const requestId = rawRequestId && rawRequestId.trim().length > 0
      ? rawRequestId.trim()
      : (request.id || IdUtils.generateUuid());

    const rawCorrelationId = request.headers[HttpHeader.X_CORRELATION_ID] as string | undefined;
    const correlationId = rawCorrelationId && rawCorrelationId.trim().length > 0
      ? rawCorrelationId.trim()
      : requestId;

    // Fastify assigns request.id, align it
    request.id = requestId;

    // Ensure downstream client receives standard X-Request-ID response header
    reply.header(HttpHeader.X_REQUEST_ID, requestId);
    reply.header(HttpHeader.X_CORRELATION_ID, correlationId);

    const nowTimestamp = TimeUtils.nowMs();
    const startMonotonicNs = TimeUtils.monotonicNs();

    const requestContext: RequestContext = {
      requestId,
      correlationId,
      timestamp: nowTimestamp,
      startTimeMonotonicNs: startMonotonicNs,
      method: request.method as HttpMethod,
      url: request.url,
      routePath: request.routeOptions?.url ?? request.url,
      client: {
        ip: request.ip,
        userAgent: (request.headers[HttpHeader.USER_AGENT] as string) || 'unknown',
        host: (request.headers.host as string) || 'unknown',
        protocol: request.protocol
      }
    };

    request.requestContext = requestContext;

    // Seed log context for AsyncLocalStorage
    LogContext.run(
      {
        requestId,
        correlationId
      },
      () => {
        done();
      }
    );
  });
};

export const registerRequestContext = fp(requestContextPlugin, {
  name: 'webos-request-context',
  fastify: '4.x'
});
