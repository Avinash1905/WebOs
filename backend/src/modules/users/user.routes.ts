/**
 * WebOS Backend - Module 4: User Management Fastify Routes
 */

import type { FastifyInstance, FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import type { UserController } from './user.controller.js';

export interface UserRoutesOptions {
  readonly controller: UserController;
  readonly authGuard?: preHandlerHookHandler;
  readonly adminGuard?: preHandlerHookHandler;
}

export function createUserRoutes(options: UserRoutesOptions): FastifyPluginAsync {
  const { controller, authGuard, adminGuard } = options;

  return async (users: FastifyInstance) => {
    // Current user endpoints (require authentication)
    const authHooks = authGuard ? [authGuard] : [];
    const adminHooks = adminGuard ? [adminGuard] : authHooks;

    users.get('/me', { preHandler: authHooks }, controller.getMe);
    users.patch('/me/profile', { preHandler: authHooks }, controller.updateMe);
    users.get('/me/desktop', { preHandler: authHooks }, controller.getDesktopPreferences);
    users.put('/me/desktop', { preHandler: authHooks }, controller.updateDesktopPreferences);

    // Administrative user management endpoints
    users.get('/', { preHandler: adminHooks }, controller.listUsers);
    users.get('/:id', { preHandler: adminHooks }, controller.getUserById);
    users.patch('/:id/status', { preHandler: adminHooks }, controller.changeStatus);
    users.delete('/:id', { preHandler: adminHooks }, controller.deleteUser);
  };
}
