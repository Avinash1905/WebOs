/**
 * WebOS Backend - Module 6: Session Management Fastify Routes
 */

import type { FastifyInstance, FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import type { SessionController } from './session.controller.js';

export interface SessionRoutesOptions {
  readonly controller: SessionController;
  readonly authGuard: preHandlerHookHandler;
}

export function createSessionRoutes(options: SessionRoutesOptions): FastifyPluginAsync {
  const { controller, authGuard } = options;

  return async (sessions: FastifyInstance) => {
    // All session endpoints require active authentication
    sessions.addHook('preHandler', authGuard);

    sessions.get('/me', controller.listMySessions);
    sessions.delete('/:id', controller.revokeSession);
    sessions.post('/revoke-others', controller.revokeOtherSessions);
  };
}
