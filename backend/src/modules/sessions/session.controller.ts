/**
 * WebOS Backend - Session Management HTTP Controller
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SessionService } from './session.service.js';
import { RevokeSessionParamsSchema } from './session.schemas.js';
import { HttpStatus } from '../../common/types/http.types.js';
import { ValidationError, UnauthorizedError } from '../../common/errors/specific-errors.js';

export class SessionController {
  private readonly sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public listMySessions = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    const currentSessionId = request.requestContext?.sessionId;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const sessions = await this.sessionService.getUserActiveSessions(userId, currentSessionId);
    return reply.sendSuccess(sessions, HttpStatus.OK);
  };

  public revokeSession = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const parseResult = RevokeSessionParamsSchema.safeParse(request.params);
    if (!parseResult.success) {
      throw new ValidationError(
        'Session parameter validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    await this.sessionService.revokeSession(parseResult.data.id, userId);
    return reply.sendSuccess({ message: 'Session revoked successfully' }, HttpStatus.OK);
  };

  public revokeOtherSessions = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    const currentSessionId = request.requestContext?.sessionId;

    if (!userId || !currentSessionId) {
      throw new UnauthorizedError('Authentication required');
    }

    const count = await this.sessionService.revokeAllOtherSessions(userId, currentSessionId);
    return reply.sendSuccess(
      { message: `Successfully revoked ${count} other active session(s)` },
      HttpStatus.OK
    );
  };
}
