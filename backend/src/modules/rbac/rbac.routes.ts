/**
 * WebOS Backend - Module 5: RBAC Fastify Routes
 */

import type { FastifyInstance, FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import type { RbacController } from './rbac.controller.js';

export interface RbacRoutesOptions {
  readonly controller: RbacController;
  readonly authGuard?: preHandlerHookHandler;
  readonly adminGuard?: preHandlerHookHandler;
}

export function createRoleRoutes(options: RbacRoutesOptions): FastifyPluginAsync {
  const { controller, authGuard, adminGuard } = options;

  return async (roles: FastifyInstance) => {
    const authHooks = authGuard ? [authGuard] : [];
    const adminHooks = adminGuard ? [adminGuard] : authHooks;

    roles.get('/', { preHandler: authHooks }, controller.listRoles);
    roles.get('/:id', { preHandler: authHooks }, controller.getRole);
    roles.post('/', { preHandler: adminHooks }, controller.createRole);
    roles.patch('/:id', { preHandler: adminHooks }, controller.updateRole);
    roles.delete('/:id', { preHandler: adminHooks }, controller.deleteRole);

    roles.post('/assign', { preHandler: adminHooks }, controller.assignRole);
    roles.delete('/:userId/:roleId', { preHandler: adminHooks }, controller.removeRole);
  };
}

export function createPermissionRoutes(options: RbacRoutesOptions): FastifyPluginAsync {
  const { controller, authGuard } = options;

  return async (perms: FastifyInstance) => {
    const authHooks = authGuard ? [authGuard] : [];

    perms.get('/', { preHandler: authHooks }, controller.listPermissions);
    perms.get('/me', { preHandler: authHooks }, controller.getMyPermissions);
  };
}
