/**
 * WebOS Backend - Prisma Database Unit of Work & Transaction Runner
 */

import { PrismaUserRepository } from './prisma-user.repository.js';
import { PrismaUserProfileRepository } from './prisma-user-profile.repository.js';
import { PrismaRoleRepository } from './prisma-role.repository.js';
import { PrismaPermissionRepository } from './prisma-permission.repository.js';
import { PrismaUserRoleRepository } from './prisma-user-role.repository.js';
import { PrismaRolePermissionRepository } from './prisma-role-permission.repository.js';
import { PrismaSessionRepository } from './prisma-session.repository.js';
import { PrismaSessionDeviceRepository } from './prisma-session-device.repository.js';
import { PrismaAuthAttemptRepository } from './prisma-auth-attempt.repository.js';
import { PrismaPasswordResetTokenRepository } from './prisma-password-reset-token.repository.js';
import { PrismaEmailVerificationTokenRepository } from './prisma-email-verification-token.repository.js';
import { PrismaSecurityEventRepository } from './prisma-security-event.repository.js';
import { PrismaLoginHistoryRepository } from './prisma-login-history.repository.js';
import type { IDatabaseTransaction, ITransactionRunner } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';
import { TransactionManager } from '../../transaction.manager.js';
import type { ILogger } from '../../../../common/logging/logger.types.js';

export class PrismaDatabase implements IDatabaseTransaction, ITransactionRunner {
  public readonly users: PrismaUserRepository;
  public readonly profiles: PrismaUserProfileRepository;
  public readonly roles: PrismaRoleRepository;
  public readonly permissions: PrismaPermissionRepository;
  public readonly userRoles: PrismaUserRoleRepository;
  public readonly rolePermissions: PrismaRolePermissionRepository;
  public readonly sessions: PrismaSessionRepository;
  public readonly sessionDevices: PrismaSessionDeviceRepository;
  public readonly authAttempts: PrismaAuthAttemptRepository;
  public readonly passwordResetTokens: PrismaPasswordResetTokenRepository;
  public readonly emailVerificationTokens: PrismaEmailVerificationTokenRepository;
  public readonly securityEvents: PrismaSecurityEventRepository;
  public readonly loginHistories: PrismaLoginHistoryRepository;

  private readonly logger: ILogger;
  private readonly txManager: TransactionManager;

  constructor(prisma: IPrismaClient, logger: ILogger) {
    this.logger = logger;
    this.txManager = new TransactionManager(prisma, logger);

    this.users = new PrismaUserRepository(prisma);
    this.profiles = new PrismaUserProfileRepository(prisma);
    this.roles = new PrismaRoleRepository(prisma);
    this.permissions = new PrismaPermissionRepository(prisma);
    this.userRoles = new PrismaUserRoleRepository(prisma);
    this.rolePermissions = new PrismaRolePermissionRepository(prisma);
    this.sessions = new PrismaSessionRepository(prisma);
    this.sessionDevices = new PrismaSessionDeviceRepository(prisma);
    this.authAttempts = new PrismaAuthAttemptRepository(prisma);
    this.passwordResetTokens = new PrismaPasswordResetTokenRepository(prisma);
    this.emailVerificationTokens = new PrismaEmailVerificationTokenRepository(prisma);
    this.securityEvents = new PrismaSecurityEventRepository(prisma);
    this.loginHistories = new PrismaLoginHistoryRepository(prisma);
  }

  public async runTransaction<T>(
    operation: (tx: IDatabaseTransaction) => Promise<T>
  ): Promise<T> {
    return this.txManager.runWithRetry(async (txPrisma: IPrismaClient) => {
      const txDb = new PrismaDatabase(txPrisma, this.logger);
      return operation(txDb);
    });
  }
}
