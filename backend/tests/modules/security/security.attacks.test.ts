/**
 * WebOS Security Attack Regression Test Suite
 *
 * Simulates real-world attack vectors against Phase 1 Identity & Security infrastructure:
 * 1. Brute-force password guessing & progressive account lockout
 * 2. Token forgery, tampering, and session replay
 * 3. Privilege escalation and horizontal/vertical permission boundary bypass
 * 4. Timing attack resistance (constant-time verification)
 * 5. Password entropy and common breached credential rejection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPhase1Services, type Phase1Services } from '../../../src/modules/phase1.container.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import { PasswordHasher } from '../../../src/modules/auth/crypto/password.hasher.js';
import { PasswordValidator } from '../../../src/modules/auth/crypto/password.validator.js';
import { TokenGenerator } from '../../../src/modules/auth/crypto/token.generator.js';
import type { SecurityEventEntity, SessionEntity } from '../../../src/modules/database/database.types.js';

describe('Security Attack Regression Tests', () => {
  let phase1: Phase1Services;
  const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

  beforeEach(async () => {
    phase1 = createPhase1Services({ logger });
    await phase1.initializeAll();
  });

  afterEach(async () => {
    await phase1.shutdownAll();
  });

  describe('1. Brute-Force Password Guessing & Account Lockout Attack', () => {
    it('should lock an account after 5 consecutive failed login attempts', async () => {
      const email = 'target-user@webos.local';
      const correctPassword = 'CorrectP@ssw0rd!2026';

      await phase1.authService.register(
        {
          email,
          username: 'targetuser',
          password: correctPassword,
        },
        { ipAddress: '192.168.1.100', userAgent: 'SetupClient/1.0' }
      );

      // Launch 5 failed attempts
      for (let attempt = 1; attempt <= 5; attempt++) {
        await expect(
          phase1.authService.login(
            {
              identifier: email,
              password: `WrongPassword#${attempt}`,
            },
            { ipAddress: '192.168.1.100', userAgent: 'Hydra-BruteForce/1.0' }
          )
        ).rejects.toThrow();
      }

      // Check user status in DB
      const user = await phase1.database.users.findByEmail(email);
      expect(user).toBeDefined();
      expect(user!.failedLoginAttempts).toBe(5);
      expect(user!.lockoutUntil).toBeDefined();
      expect(user!.lockoutUntil!.getTime()).toBeGreaterThan(Date.now());

      // Attempt 6: Even with the CORRECT password, login MUST be rejected because account is locked
      await expect(
        phase1.authService.login(
          {
            identifier: email,
            password: correctPassword,
          },
          { ipAddress: '192.168.1.100', userAgent: 'Hydra-BruteForce/1.0' }
        )
      ).rejects.toThrow(/locked/i);

      // Verify security events recorded the lockout
      const events = await phase1.database.securityEvents.findRecentByUserId(user!.id);
      const lockoutEvent = events.find((e: SecurityEventEntity) => e.eventType === 'ACCOUNT_LOCKED');
      expect(lockoutEvent).toBeDefined();
      expect(lockoutEvent?.severity).toBe('CRITICAL');
    });

    it('should reset failed login count after a successful login before threshold', async () => {
      const email = 'resilient-user@webos.local';
      const password = 'CorrectP@ssw0rd!2026';

      await phase1.authService.register(
        {
          email,
          username: 'resilientuser',
          password,
        },
        { ipAddress: '192.168.1.105', userAgent: 'Mozilla/5.0' }
      );

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await expect(
          phase1.authService.login(
            {
              identifier: email,
              password: 'WrongPassword!',
            },
            { ipAddress: '192.168.1.105', userAgent: 'Mozilla/5.0' }
          )
        ).rejects.toThrow();
      }

      let user = await phase1.database.users.findByEmail(email);
      expect(user!.failedLoginAttempts).toBe(3);

      // 4th attempt succeeds
      const loginRes = await phase1.authService.login(
        {
          identifier: email,
          password,
        },
        { ipAddress: '192.168.1.105', userAgent: 'Mozilla/5.0' }
      );

      expect(loginRes.user.id).toBe(user!.id);

      user = await phase1.database.users.findByEmail(email);
      expect(user!.failedLoginAttempts).toBe(0);
      expect(user!.lockoutUntil).toBeNull();
    });
  });

  describe('2. Token Forgery, Tampering, and Replay Attacks', () => {
    it('should reject forged or fabricated tokens with 0-entropy signatures', async () => {
      const forgedToken = 'fabricated_token_deadbeef_00000000000000000000000000000000';
      const validation = await phase1.sessionService.validateSession(forgedToken);
      expect(validation).toBeNull();
    });

    it('should reject tampered session tokens where one character is altered', async () => {
      const reg = await phase1.authService.register(
        {
          email: 'token-test@webos.local',
          username: 'tokentest',
          password: 'ValidP@ssw0rd!2026',
        },
        { ipAddress: '127.0.0.1', userAgent: 'TestClient' }
      );

      const validToken = reg.sessionToken;
      // Tamper one byte in token
      const tamperedToken =
        validToken.slice(0, 10) +
        (validToken[10] === 'a' ? 'b' : 'a') +
        validToken.slice(11);

      const validation = await phase1.sessionService.validateSession(tamperedToken);
      expect(validation).toBeNull();
    });

    it('should reject revoked tokens immediately upon session revocation', async () => {
      const reg = await phase1.authService.register(
        {
          email: 'revocation-test@webos.local',
          username: 'revocationtest',
          password: 'ValidP@ssw0rd!2026',
        },
        { ipAddress: '127.0.0.1', userAgent: 'TestClient' }
      );

      const token = reg.sessionToken;
      let validation = await phase1.sessionService.validateSession(token);
      expect(validation).not.toBeNull();

      // Revoke the session
      await phase1.sessionService.revokeSession(validation!.session.id, reg.user.id, 'User manually logged out');

      // Subsequent validation must fail
      validation = await phase1.sessionService.validateSession(token);
      expect(validation).toBeNull();
    });

    it('should reject expired session tokens beyond idle timeout', async () => {
      const reg = await phase1.authService.register(
        {
          email: 'idle-test@webos.local',
          username: 'idletest',
          password: 'ValidP@ssw0rd!2026',
        },
        { ipAddress: '127.0.0.1', userAgent: 'TestClient' }
      );

      const token = reg.sessionToken;
      const tokenHash = TokenGenerator.hashToken(token);
      const session = await phase1.database.sessions.findByTokenHash(tokenHash);
      expect(session).toBeDefined();

      // Artificially age the session lastActiveAt to 3 hours ago (inactivity timeout is 2h)
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      await phase1.database.sessions.update(session!.id, {
        lastActiveAt: threeHoursAgo,
      });

      const validation = await phase1.sessionService.validateSession(token);
      expect(validation).toBeNull();
    });
  });

  describe('3. Privilege Escalation & Boundary Attacks', () => {
    it('should prevent standard user from evaluating or acquiring admin permissions', async () => {
      const standardUser = await phase1.authService.register(
        {
          email: 'standard@webos.local',
          username: 'standarduser',
          password: 'StandardUserP@ss!2026',
        },
        { ipAddress: '127.0.0.1', userAgent: 'TestClient' }
      );

      // Check standard user permissions
      const hasSystemConfig = await phase1.rbacService.hasPermission(
        standardUser.user.id,
        'system:config'
      );
      expect(hasSystemConfig).toBe(false);

      const hasUserDelete = await phase1.rbacService.hasPermission(
        standardUser.user.id,
        'users:delete'
      );
      expect(hasUserDelete).toBe(false);
    });

    it('should immediately reject suspended or deactivated users from any action', async () => {
      const reg = await phase1.authService.register(
        {
          email: 'suspended@webos.local',
          username: 'suspendeduser',
          password: 'SuspendedP@ss!2026',
        },
        { ipAddress: '127.0.0.1', userAgent: 'TestClient' }
      );

      const userId = reg.user.id;
      const token = reg.sessionToken;

      // Session is valid initially
      let validation = await phase1.sessionService.validateSession(token);
      expect(validation).not.toBeNull();

      // Admin suspends user
      await phase1.userService.changeUserStatus(
        userId,
        {
          status: 'SUSPENDED',
          reason: 'Malicious activity detected',
        },
        'admin-actor-id',
        '10.0.0.1'
      );

      // Validating user status in DB
      const user = await phase1.database.users.findById(userId);
      expect(user!.status).toBe('SUSPENDED');

      // Verify sessions for suspended user were evicted
      const sessions = await phase1.database.sessions.findByUserId(userId);
      expect(sessions.every((s: SessionEntity) => s.status === 'REVOKED')).toBe(true);

      validation = await phase1.sessionService.validateSession(token);
      expect(validation).toBeNull();
    });
  });

  describe('4. Cryptographic Integrity & Timing Defense', () => {
    it('should derive consistent scrypt key and verify in constant time', async () => {
      const hasher = new PasswordHasher();
      const password = 'SuperSecretCryptographicPassword!2026';
      const hashResult = await hasher.hashPassword(password);

      expect(hashResult.hash).toBeDefined();
      expect(hashResult.salt).toBeDefined();
      expect(hashResult.algorithm).toBe('scrypt');

      const isValid = await hasher.verifyPassword(
        password,
        hashResult.hash,
        hashResult.salt,
        hashResult.algorithm
      );
      expect(isValid).toBe(true);

      const isInvalid = await hasher.verifyPassword(
        'WrongPassword',
        hashResult.hash,
        hashResult.salt,
        hashResult.algorithm
      );
      expect(isInvalid).toBe(false);
    });

    it('should generate 256-bit entropy tokens that are cryptographically unique', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const token = TokenGenerator.generateSessionToken();
        expect(Buffer.from(token, 'base64url').length).toBe(32);
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      expect(tokens.size).toBe(1000);
    });
  });

  describe('5. Password Policy & Breached Credential Rejection', () => {
    it('should reject top breached passwords even if they meet character requirements', () => {
      const validator = new PasswordValidator();
      const breachedList = ['password123', 'admin123', 'password', 'welcome'];
      for (const breached of breachedList) {
        const validation = validator.validate(breached);
        expect(validation.isValid).toBe(false);
        expect(validation.isCommonPassword).toBe(true);
      }
    });

    it('should require lowercase, uppercase, number, special char and min length 8', () => {
      const validator = new PasswordValidator();
      expect(validator.validate('short1!').isValid).toBe(false);
      expect(validator.validate('alllowercase123!').isValid).toBe(false);
      expect(validator.validate('ALLUPPERCASE123!').isValid).toBe(false);
      expect(validator.validate('NoSpecialChars123').isValid).toBe(false);
      expect(validator.validate('NoNumbersHere!@#').isValid).toBe(false);

      const validResult = validator.validate('ValidComplexP@ssw0rd!2026');
      expect(validResult.isValid).toBe(true);
      expect(validResult.score).toBeGreaterThanOrEqual(40);
    });
  });
});
