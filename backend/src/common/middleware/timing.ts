/**
 * WebOS Backend Foundation - Server Timing & Duration Middleware
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { TimeUtils } from '../utils/time.js';
import { HttpHeader } from '../types/http.types.js';

const timingPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onSend', (request: FastifyRequest, reply: FastifyReply, payload, done) => {
    const startNs = (request as unknown as { _startTimeMonotonic?: bigint })._startTimeMonotonic;
    if (startNs) {
      const durationMs = TimeUtils.durationMs(startNs);
      const roundedMs = parseFloat(durationMs.toFixed(2));

      reply.header(HttpHeader.X_RESPONSE_TIME, `${roundedMs}ms`);
      reply.header(HttpHeader.SERVER_TIMING, `total;dur=${roundedMs};desc="Total Request Processing"`);
    }
    done(null, payload);
  });
};

export const registerServerTiming = fp(timingPlugin, {
  name: 'webos-server-timing',
  fastify: '4.x'
});
