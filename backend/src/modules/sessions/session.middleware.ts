/**
 * WebOS Backend - Session Authentication Middleware Hook
 * Extracts Bearer token or Cookie, validates session status, and injects context.
 */

import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { SessionService } from './session.service.js';
import { UnauthorizedError } from '../../common/errors/specific-errors.js';

export interface SessionAuthHookOptions {
  readonly optional?: boolean;
}

export function createSessionAuthHook(
  sessionService: SessionService,
  options: SessionAuthHookOptions = {}
): preHandlerHookHandler {
  const isOptional = options.optional ?? false;

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const rawToken = extractSessionToken(request);

    if (!rawToken) {
      if (isOptional) {
        return;
      }
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const authResult = await sessionService.validateSession(rawToken);

    if (!authResult) {
      if (isOptional) {
        return;
      }
      throw new UnauthorizedError('Session has expired or is invalid. Please log in again.');
    }

    const { session, user, roles } = authResult;

    // Enrich existing requestContext
    if (request.requestContext) {
      request.requestContext = {
        ...request.requestContext,
        userId: user.id,
        sessionId: session.id,
        roles
      };
    }
  };
}

/**
 * Extracts raw session token from Bearer authorization header or Cookie.
 */
export function extractSessionToken(request: FastifyRequest): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.length > 0) {
      return token;
    }
  }

  // 2. Cookie header: "webos_session=<token>"
  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)webos_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
}
