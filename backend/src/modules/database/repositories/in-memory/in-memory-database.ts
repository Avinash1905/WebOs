/**
 * WebOS Backend - In-Memory Database / Unit of Work
 * Provides a fully integrated in-memory transaction runner and repository container.
 */

import { InMemoryUserRepository } from './in-memory-user.repository.js';
import { InMemoryUserProfileRepository } from './in-memory-user-profile.repository.js';
import { InMemoryRoleRepository } from './in-memory-role.repository.js';
import { InMemoryPermissionRepository } from './in-memory-permission.repository.js';
import { InMemoryUserRoleRepository } from './in-memory-user-role.repository.js';
import { InMemoryRolePermissionRepository } from './in-memory-role-permission.repository.js';
import { InMemorySessionRepository } from './in-memory-session.repository.js';
import { InMemorySessionDeviceRepository } from './in-memory-session-device.repository.js';
import { InMemoryAuthAttemptRepository } from './in-memory-auth-attempt.repository.js';
import { InMemoryPasswordResetTokenRepository } from './in-memory-password-reset-token.repository.js';
import { InMemoryEmailVerificationTokenRepository } from './in-memory-email-verification-token.repository.js';
import { InMemorySecurityEventRepository } from './in-memory-security-event.repository.js';
import { InMemoryLoginHistoryRepository } from './in-memory-login-history.repository.js';
import type { IDatabaseTransaction, ITransactionRunner } from '../../database.types.js';

export class InMemoryDatabase implements IDatabaseTransaction, ITransactionRunner {
  public readonly users: InMemoryUserRepository;
  public readonly profiles: InMemoryUserProfileRepository;
  public readonly roles: InMemoryRoleRepository;
  public readonly permissions: InMemoryPermissionRepository;
  public readonly userRoles: InMemoryUserRoleRepository;
  public readonly rolePermissions: InMemoryRolePermissionRepository;
  public readonly sessions: InMemorySessionRepository;
  public readonly sessionDevices: InMemorySessionDeviceRepository;
  public readonly authAttempts: InMemoryAuthAttemptRepository;
  public readonly passwordResetTokens: InMemoryPasswordResetTokenRepository;
  public readonly emailVerificationTokens: InMemoryEmailVerificationTokenRepository;
  public readonly securityEvents: InMemorySecurityEventRepository;
  public readonly loginHistories: InMemoryLoginHistoryRepository;

  constructor() {
    this.users = new InMemoryUserRepository();
    this.profiles = new InMemoryUserProfileRepository();
    this.roles = new InMemoryRoleRepository();
    this.permissions = new InMemoryPermissionRepository();
    this.userRoles = new InMemoryUserRoleRepository();
    this.rolePermissions = new InMemoryRolePermissionRepository();
    this.sessions = new InMemorySessionRepository();
    this.sessionDevices = new InMemorySessionDeviceRepository();
    this.authAttempts = new InMemoryAuthAttemptRepository();
    this.passwordResetTokens = new InMemoryPasswordResetTokenRepository();
    this.emailVerificationTokens = new InMemoryEmailVerificationTokenRepository();
    this.securityEvents = new InMemorySecurityEventRepository();
    this.loginHistories = new InMemoryLoginHistoryRepository();

    // Wire dependencies
    this.roles.setUserRoleRepository(this.userRoles);
    this.permissions.setDependencies(this.rolePermissions, this.userRoles);
  }

  public async runTransaction<T>(operation: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    // In-memory transactions execute directly against the unit of work
    return operation(this);
  }

  public clearAll(): void {
    this.users.clear();
    this.profiles.clear();
    this.roles.clear();
    this.permissions.clear();
    this.userRoles.clear();
    this.rolePermissions.clear();
    this.sessions.clear();
    this.sessionDevices.clear();
    this.authAttempts.clear();
    this.passwordResetTokens.clear();
    this.emailVerificationTokens.clear();
    this.securityEvents.clear();
    this.loginHistories.clear();
  }
}
