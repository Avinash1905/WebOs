import type { FastifyInstance, FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import type { AuthController } from './auth.controller.js';

export interface AuthRoutesOptions {
  readonly controller: AuthController;
  readonly authGuard?: preHandlerHookHandler;
}

export function createAuthRoutes(
  controllerOrOptions: AuthController | AuthRoutesOptions,
  optionalGuard?: preHandlerHookHandler
): FastifyPluginAsync {
  const controller =
    'controller' in controllerOrOptions ? controllerOrOptions.controller : controllerOrOptions;
  const authGuard =
    'authGuard' in controllerOrOptions ? controllerOrOptions.authGuard : optionalGuard;
  const authHooks = authGuard ? [authGuard] : [];

  return async (auth: FastifyInstance) => {
    // Public authentication routes
    auth.post('/register', controller.register);
    auth.post('/login', controller.login);
    auth.post('/forgot-password', controller.forgotPassword);
    auth.post('/reset-password', controller.resetPassword);
    auth.post('/verify-email', controller.verifyEmail);

    // Protected authentication routes
    auth.post('/logout', { preHandler: authHooks }, controller.logout);
    auth.post('/change-password', { preHandler: authHooks }, controller.changePassword);
  };
}
