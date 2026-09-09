/**
 * WebOS Backend - Authentication Service Tests
 * Unit & domain logic verification for user authentication, passwords, lockout, and sessions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase } from '../../../src/modules/database/repositories/in-memory/in-memory-database.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { LockoutManager } from '../../../src/modules/auth/lockout/lockout.manager.js';
import { SecurityEventRecorder } from '../../../src/modules/auth/security-events/security-event.recorder.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError
} from '../../../src/common/errors/specific-errors.js';

describe('AuthService', () => {
  let db: InMemoryDatabase;
  let authService: AuthService;
  const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

  beforeEach(async () => {
    db = new InMemoryDatabase();
    const securityEvents = new SecurityEventRecorder(db.securityEvents, logger);
    const lockoutManager = new LockoutManager(db.users, db.authAttempts, {
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      progressiveLockout: false
    });

    authService = new AuthService(
      {
        users: db.users,
        profiles: db.profiles,
        roles: db.roles,
        userRoles: db.userRoles,
        sessions: db.sessions,
        sessionDevices: db.sessionDevices,
        passwordResetTokens: db.passwordResetTokens,
        emailVerificationTokens: db.emailVerificationTokens,
        loginHistories: db.loginHistories,
        lockoutManager,
        securityEvents
      },
      { logger }
    );

    await authService.initialize();
  });

  const secContext = { ipAddress: '127.0.0.1', userAgent: 'WebOSTestRunner/1.0' };

  describe('register', () => {
    it('should register a new user successfully and return session token', async () => {
      const result = await authService.register(
        {
          username: 'alice_webos',
          email: 'alice@webos.dev',
          password: 'CorrectHorseBattery123!',
          displayName: 'Alice Developer'
        },
        secContext
      );

      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('alice_webos');
      expect(result.user.email).toBe('alice@webos.dev');
      expect(result.user.profile?.displayName).toBe('Alice Developer');
      expect(result.user.roles).toContain('USER');
      expect(result.sessionToken).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Verify stored in DB
      const stored = await db.users.findByUsername('alice_webos');
      expect(stored).not.toBeNull();
      expect(stored?.passwordHash).not.toBe('CorrectHorseBattery123!');
      expect(stored?.salt).toBeDefined();
    });

    it('should reject duplicate username', async () => {
      await authService.register(
        {
          username: 'duplicate_user',
          email: 'dup1@webos.dev',
          password: 'Password123!@#'
        },
        secContext
      );

      await expect(
        authService.register(
          {
            username: 'duplicate_user',
            email: 'dup2@webos.dev',
            password: 'Password123!@#'
          },
          secContext
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should reject duplicate email', async () => {
      await authService.register(
        {
          username: 'first_user',
          email: 'shared@webos.dev',
          password: 'Password123!@#'
        },
        secContext
      );

      await expect(
        authService.register(
          {
            username: 'second_user',
            email: 'shared@webos.dev',
            password: 'Password123!@#'
          },
          secContext
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should reject weak password', async () => {
      await expect(
        authService.register(
          {
            username: 'weak_pass_user',
            email: 'weak@webos.dev',
            password: '123'
          },
          secContext
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(
        {
          username: 'bob_the_tester',
          email: 'bob@webos.dev',
          password: 'StrongSecretPassword456!'
        },
        secContext
      );
    });

    it('should log in successfully with valid credentials', async () => {
      const result = await authService.login(
        {
          identifier: 'bob_the_tester',
          password: 'StrongSecretPassword456!'
        },
        secContext
      );

      expect(result.user.username).toBe('bob_the_tester');
      expect(result.sessionToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('should log in successfully using email as identifier', async () => {
      const result = await authService.login(
        {
          identifier: 'bob@webos.dev',
          password: 'StrongSecretPassword456!'
        },
        secContext
      );

      expect(result.user.username).toBe('bob_the_tester');
    });

    it('should reject incorrect password', async () => {
      await expect(
        authService.login(
          {
            identifier: 'bob_the_tester',
            password: 'WrongPassword123!'
          },
          secContext
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should reject unknown user', async () => {
      await expect(
        authService.login(
          {
            identifier: 'non_existent_user',
            password: 'Password123!'
          },
          secContext
        )
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should trigger account lockout after 5 consecutive failed attempts', async () => {
      // 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await expect(
          authService.login(
            { identifier: 'bob_the_tester', password: 'WrongPassword!' },
            secContext
          )
        ).rejects.toThrow(UnauthorizedError);
      }

      // 5th failed attempt should trigger lockout and throw ForbiddenError
      await expect(
        authService.login(
          { identifier: 'bob_the_tester', password: 'WrongPassword!' },
          secContext
        )
      ).rejects.toThrow(ForbiddenError);

      // Even correct password should now be blocked
      await expect(
        authService.login(
          { identifier: 'bob_the_tester', password: 'StrongSecretPassword456!' },
          secContext
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('password reset', () => {
    beforeEach(async () => {
      await authService.register(
        {
          username: 'charlie_reset',
          email: 'charlie@webos.dev',
          password: 'InitialPassword123!'
        },
        secContext
      );
    });

    it('should issue a reset token and allow password reset', async () => {
      const reqResult = await authService.requestPasswordReset(
        { email: 'charlie@webos.dev' },
        secContext
      );
      expect(reqResult.resetToken).toBeDefined();

      await authService.resetPassword(
        {
          token: reqResult.resetToken!,
          newPassword: 'BrandNewStrongPassword789!'
        },
        secContext
      );

      // Old password should fail
      await expect(
        authService.login(
          { identifier: 'charlie_reset', password: 'InitialPassword123!' },
          secContext
        )
      ).rejects.toThrow(UnauthorizedError);

      // New password should succeed
      const loginRes = await authService.login(
        { identifier: 'charlie_reset', password: 'BrandNewStrongPassword789!' },
        secContext
      );
      expect(loginRes.user.username).toBe('charlie_reset');
    });

    it('should reject reused or expired reset tokens', async () => {
      const reqResult = await authService.requestPasswordReset(
        { email: 'charlie@webos.dev' },
        secContext
      );

      await authService.resetPassword(
        {
          token: reqResult.resetToken!,
          newPassword: 'BrandNewStrongPassword789!'
        },
        secContext
      );

      // Trying to reuse the same token
      await expect(
        authService.resetPassword(
          {
            token: reqResult.resetToken!,
            newPassword: 'AnotherPassword999!'
          },
          secContext
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('change password', () => {
    it('should allow authenticated user to change password', async () => {
      const reg = await authService.register(
        {
          username: 'david_change',
          email: 'david@webos.dev',
          password: 'OldPassword123!'
        },
        secContext
      );

      await authService.changePassword(
        {
          userId: reg.user.id,
          currentPassword: 'OldPassword123!',
          newPassword: 'UpdatedPassword456!'
        },
        secContext
      );

      // Verify login with new password
      const loginRes = await authService.login(
        { identifier: 'david_change', password: 'UpdatedPassword456!' },
        secContext
      );
      expect(loginRes.user.id).toBe(reg.user.id);
    });

    it('should reject change password if current password is wrong', async () => {
      const reg = await authService.register(
        {
          username: 'eva_change',
          email: 'eva@webos.dev',
          password: 'OldPassword123!'
        },
        secContext
      );

      await expect(
        authService.changePassword(
          {
            userId: reg.user.id,
            currentPassword: 'WrongOldPassword!',
            newPassword: 'UpdatedPassword456!'
          },
          secContext
        )
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
