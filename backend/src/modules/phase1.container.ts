/**
 * WebOS Backend - Phase 1 Service Composition Root & Container
 * Wires repositories, managers, security recorders, and domain services together.
 */

import type { ILogger } from '../common/logging/logger.types.js';
import type { IPrismaClient } from './database/prisma.types.js';
import { InMemoryDatabase } from './database/repositories/in-memory/in-memory-database.js';
import { PrismaDatabase } from './database/repositories/prisma/prisma-database.js';
import { AuthService } from './auth/auth.service.js';
import { UserService } from './users/user.service.js';
import { RbacService } from './rbac/rbac.service.js';
import { SessionService } from './sessions/session.service.js';
import { LockoutManager } from './auth/lockout/lockout.manager.js';
import { SecurityEventRecorder } from './auth/security-events/security-event.recorder.js';
import { PasswordHasher } from './auth/crypto/password.hasher.js';
import { PasswordValidator } from './auth/crypto/password.validator.js';
import { PermissionCache } from './rbac/permission.cache.js';
import { RoleHierarchyService } from './rbac/role-hierarchy.service.js';
import { AuthController } from './auth/auth.controller.js';
import { UserController } from './users/user.controller.js';
import { RbacController } from './rbac/rbac.controller.js';
import { SessionController } from './sessions/session.controller.js';
import { createSessionAuthHook } from './sessions/session.middleware.js';
import { requireRole } from './rbac/rbac.guards.js';
import type { ServiceContext } from '../services/service.types.js';

export interface Phase1ContainerOptions {
  readonly prismaClient?: IPrismaClient;
  readonly logger: ILogger;
}

export interface Phase1Services {
  readonly database: InMemoryDatabase | PrismaDatabase;
  readonly authService: AuthService;
  readonly userService: UserService;
  readonly rbacService: RbacService;
  readonly sessionService: SessionService;
  readonly lockoutManager: LockoutManager;
  readonly securityEvents: SecurityEventRecorder;
  readonly authController: AuthController;
  readonly userController: UserController;
  readonly rbacController: RbacController;
  readonly sessionController: SessionController;
  readonly authGuard: ReturnType<typeof createSessionAuthHook>;
  readonly adminGuard: ReturnType<typeof requireRole>;
  initializeAll(): Promise<void>;
  shutdownAll(): Promise<void>;
}

export function createPhase1Services(options: Phase1ContainerOptions): Phase1Services {
  const { prismaClient, logger } = options;

  // 1. Data Store Selection (In-Memory or Prisma)
  const database = prismaClient
    ? new PrismaDatabase(prismaClient, logger)
    : new InMemoryDatabase();

  const serviceContext: ServiceContext = { logger };

  // 2. Security & Identity Infrastructure
  const securityEvents = new SecurityEventRecorder(database.securityEvents, logger);
  const lockoutManager = new LockoutManager(database.users, database.authAttempts);
  const passwordHasher = new PasswordHasher();
  const passwordValidator = new PasswordValidator();
  const permissionCache = new PermissionCache();
  const hierarchyService = new RoleHierarchyService();

  // 3. Domain Services
  const authService = new AuthService(
    {
      users: database.users,
      profiles: database.profiles,
      roles: database.roles,
      userRoles: database.userRoles,
      sessions: database.sessions,
      sessionDevices: database.sessionDevices,
      passwordResetTokens: database.passwordResetTokens,
      emailVerificationTokens: database.emailVerificationTokens,
      loginHistories: database.loginHistories,
      lockoutManager,
      securityEvents,
      passwordHasher,
      passwordValidator
    },
    serviceContext
  );

  const userService = new UserService(
    {
      users: database.users,
      profiles: database.profiles,
      roles: database.roles,
      userRoles: database.userRoles,
      sessions: database.sessions,
      securityEvents
    },
    serviceContext
  );

  const rbacService = new RbacService(
    {
      roles: database.roles,
      permissions: database.permissions,
      userRoles: database.userRoles,
      rolePermissions: database.rolePermissions,
      securityEvents,
      cache: permissionCache,
      hierarchy: hierarchyService
    },
    serviceContext
  );

  const sessionService = new SessionService(
    {
      sessions: database.sessions,
      sessionDevices: database.sessionDevices,
      users: database.users,
      roles: database.roles,
      securityEvents
    },
    serviceContext
  );

  // 4. Controllers & Guards
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const rbacController = new RbacController(rbacService);
  const sessionController = new SessionController(sessionService);

  const authGuard = createSessionAuthHook(sessionService);
  const adminGuard = requireRole(rbacService, 'ADMIN');

  return {
    database,
    authService,
    userService,
    rbacService,
    sessionService,
    lockoutManager,
    securityEvents,
    authController,
    userController,
    rbacController,
    sessionController,
    authGuard,
    adminGuard,

    initializeAll: async () => {
      await authService.initialize();
      await userService.initialize();
      await rbacService.initialize();
      await sessionService.initialize();
    },

    shutdownAll: async () => {
      await sessionService.shutdown();
      await rbacService.shutdown();
      await userService.shutdown();
      await authService.shutdown();
    }
  };
}
