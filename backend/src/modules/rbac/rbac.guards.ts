/**
 * WebOS Backend - RBAC Fastify Route Guards
 * Declarative preHandler hooks enforcing role and permission authorization policies.
 */

import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { RbacService } from './rbac.service.js';
import { UnauthorizedError, ForbiddenError } from '../../common/errors/specific-errors.js';

/**
 * Ensures the authenticated user possesses the specified permission(s).
 */
export function requirePermission(
  rbacService: RbacService,
  permission: string | readonly string[]
): preHandlerHookHandler {
  const permissions = Array.isArray(permission) ? permission : [permission];

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasAccess = await rbacService.hasAnyPermission(userId, permissions);
    if (!hasAccess) {
      throw new ForbiddenError(
        `Access denied. Requires one of permissions: [${permissions.join(', ')}]`
      );
    }
  };
}

/**
 * Ensures the authenticated user has all specified permissions.
 */
export function requireAllPermissions(
  rbacService: RbacService,
  permissions: readonly string[]
): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasAccess = await rbacService.hasAllPermissions(userId, permissions);
    if (!hasAccess) {
      throw new ForbiddenError(
        `Access denied. Requires all permissions: [${permissions.join(', ')}]`
      );
    }
  };
}

/**
 * Ensures the authenticated user possesses the specified role(s).
 */
export function requireRole(
  rbacService: RbacService,
  role: string | readonly string[]
): preHandlerHookHandler {
  const roles = Array.isArray(role) ? role : [role];

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRoles = await rbacService.getUserRoles(userId);
    const hasRole = roles.some((r) => userRoles.includes(r.toUpperCase()));

    if (!hasRole) {
      throw new ForbiddenError(
        `Access denied. Requires one of roles: [${roles.join(', ')}]`
      );
    }
  };
}

/**
 * Permits access if the user is acting on their own account, or possesses an administrative permission.
 */
export function requireSelfOrPermission(
  rbacService: RbacService,
  userIdParamKey: string,
  permission: string
): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const targetUserId = (request.params as Record<string, string>)[userIdParamKey];
    if (targetUserId && targetUserId === userId) {
      return; // Self access permitted
    }

    const hasPerm = await rbacService.hasPermission(userId, permission);
    if (!hasPerm) {
      throw new ForbiddenError(
        `Access denied. Requires ownership or '${permission}' permission`
      );
    }
  };
}
