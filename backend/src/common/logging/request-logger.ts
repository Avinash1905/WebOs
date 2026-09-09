/**
 * WebOS Backend Foundation - Request Lifecycle Logger Plugin
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TimeUtils } from '../utils/time.js';

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook('onRequest', (request: FastifyRequest, _reply: FastifyReply, done) => {
    // Store monotonic start timestamp on the request
    (request as unknown as { _startTimeMonotonic: bigint })._startTimeMonotonic = TimeUtils.monotonicNs();

    request.log.debug(
      {
        event: 'request_received',
        requestId: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip
      },
      `--> ${request.method} ${request.url}`
    );

    done();
  });

  app.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
    const startNs = (request as unknown as { _startTimeMonotonic?: bigint })._startTimeMonotonic;
    const durationMs = startNs ? TimeUtils.durationMs(startNs) : 0;
    const statusCode = reply.statusCode;

    const logData = {
      event: 'request_completed',
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode,
      durationMs: parseFloat(durationMs.toFixed(3)),
      ip: request.ip
    };

    const message = `<-- ${request.method} ${request.url} ${statusCode} (${TimeUtils.formatDuration(durationMs)})`;

    if (statusCode >= 500) {
      request.log.error(logData, message);
    } else if (statusCode >= 400) {
      request.log.warn(logData, message);
    } else {
      request.log.info(logData, message);
    }

    done();
  });
}
