/**
 * WebOS Backend - Session Management & Device Tracking Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase } from '../../../src/modules/database/repositories/in-memory/in-memory-database.js';
import { SessionService } from '../../../src/modules/sessions/session.service.js';
import { DeviceParser } from '../../../src/modules/sessions/device-parser.js';
import { SecurityEventRecorder } from '../../../src/modules/auth/security-events/security-event.recorder.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import { ForbiddenError } from '../../../src/common/errors/specific-errors.js';

describe('DeviceParser', () => {
  it('should parse Windows desktop Chrome User-Agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
    const info = DeviceParser.parse(ua);

    expect(info.deviceType).toBe('desktop');
    expect(info.os).toBe('Windows');
    expect(info.osVersion).toBe('10/11');
    expect(info.browser).toBe('Chrome');
    expect(info.cpuArchitecture).toBe('x86_64');
  });

  it('should parse macOS Safari User-Agent', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15';
    const info = DeviceParser.parse(ua);

    expect(info.deviceType).toBe('desktop');
    expect(info.os).toBe('macOS');
    expect(info.osVersion).toBe('10.15.7');
    expect(info.browser).toBe('Safari');
  });

  it('should parse Mobile iPhone User-Agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const info = DeviceParser.parse(ua);

    expect(info.deviceType).toBe('mobile');
    expect(info.os).toBe('iOS');
  });

  it('should parse Tablet iPad User-Agent', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
    const info = DeviceParser.parse(ua);

    expect(info.deviceType).toBe('tablet');
  });

  it('should detect automated bots and CLI tools', () => {
    const curlUa = 'curl/7.88.1';
    const info = DeviceParser.parse(curlUa);

    expect(info.deviceType).toBe('bot');
    expect(info.browser).toBe('curl');
  });
});

describe('SessionService', () => {
  let db: InMemoryDatabase;
  let sessionService: SessionService;
  const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

  beforeEach(async () => {
    db = new InMemoryDatabase();
    const securityEvents = new SecurityEventRecorder(db.securityEvents, logger);

    sessionService = new SessionService(
      {
        sessions: db.sessions,
        sessionDevices: db.sessionDevices,
        users: db.users,
        roles: db.roles,
        securityEvents,
        policy: {
          maxLifetimeMs: 10000, // 10 seconds for testing
          slidingWindowInactivityMs: 2000, // 2 seconds for testing
          maxConcurrentSessionsPerUser: 3,
          touchThrottleMs: 100
        }
      },
      { logger }
    );

    // Create a dummy user
    await db.users.create({
      username: 'session_tester',
      email: 'session@webos.dev',
      passwordHash: 'hash',
      salt: 'salt',
      algorithm: 'scrypt',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastPasswordChangeAt: new Date()
    });

    await sessionService.initialize();
  });

  it('should create and validate an active session with device info', async () => {
    const user = await db.users.findByUsername('session_tester');
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0 Safari/537.36';

    const { session, rawToken } = await sessionService.createSession(
      user!.id,
      '192.168.1.100',
      ua
    );

    expect(session.id).toBeDefined();
    expect(session.status).toBe('ACTIVE');
    expect(session.userId).toBe(user!.id);

    // Verify session device record created
    const device = await db.sessionDevices.findBySessionId(session.id);
    expect(device).not.toBeNull();
    expect(device?.os).toBe('Windows');
    expect(device?.browser).toBe('Chrome');

    // Validate rawToken
    const validated = await sessionService.validateSession(rawToken);
    expect(validated).not.toBeNull();
    expect(validated?.user.id).toBe(user!.id);
    expect(validated?.session.id).toBe(session.id);
  });

  it('should expire session after sliding window inactivity period', async () => {
    const user = await db.users.findByUsername('session_tester');
    const { session, rawToken } = await sessionService.createSession(
      user!.id,
      '127.0.0.1',
      'curl/8.0'
    );

    // Fast-forward session lastActiveAt to simulate inactivity beyond 2000ms
    const inactiveDate = new Date(Date.now() - 3000);
    await db.sessions.update(session.id, { lastActiveAt: inactiveDate });

    const validated = await sessionService.validateSession(rawToken);
    expect(validated).toBeNull();

    const stored = await db.sessions.findById(session.id);
    expect(stored?.status).toBe('EXPIRED');
  });

  it('should allow user to revoke their own session', async () => {
    const user = await db.users.findByUsername('session_tester');
    const { session, rawToken } = await sessionService.createSession(
      user!.id,
      '127.0.0.1',
      'curl/8.0'
    );

    const revoked = await sessionService.revokeSession(session.id, user!.id, 'Testing revocation');
    expect(revoked).toBe(true);

    const validated = await sessionService.validateSession(rawToken);
    expect(validated).toBeNull();
  });

  it('should prevent non-admin user from revoking another user session', async () => {
    const user = await db.users.findByUsername('session_tester');
    const { session } = await sessionService.createSession(user!.id, '127.0.0.1', 'curl/8.0');

    await expect(
      sessionService.revokeSession(session.id, 'other-unauthorized-user-id')
    ).rejects.toThrow(ForbiddenError);
  });

  it('should revoke all other sessions when requested', async () => {
    const user = await db.users.findByUsername('session_tester');

    const s1 = await sessionService.createSession(user!.id, '127.0.0.1', 'Device 1');
    const s2 = await sessionService.createSession(user!.id, '127.0.0.2', 'Device 2');
    const s3 = await sessionService.createSession(user!.id, '127.0.0.3', 'Device 3');

    // Revoke all other except s2
    const revokedCount = await sessionService.revokeAllOtherSessions(user!.id, s2.session.id);
    expect(revokedCount).toBe(2);

    // s1 and s3 should be revoked
    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s3.rawToken)).toBeNull();

    // s2 should still be active
    expect(await sessionService.validateSession(s2.rawToken)).not.toBeNull();
  });

  it('should enforce max concurrent session limits by revoking oldest', async () => {
    const user = await db.users.findByUsername('session_tester');

    // Policy limit is 3
    const s1 = await sessionService.createSession(user!.id, '1.1.1.1', 'Device 1');
    await new Promise((r) => setTimeout(r, 10));
    const s2 = await sessionService.createSession(user!.id, '2.2.2.2', 'Device 2');
    await new Promise((r) => setTimeout(r, 10));
    const s3 = await sessionService.createSession(user!.id, '3.3.3.3', 'Device 3');
    await new Promise((r) => setTimeout(r, 10));

    // Adding 4th session should evict oldest (s1)
    const s4 = await sessionService.createSession(user!.id, '4.4.4.4', 'Device 4');

    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s2.rawToken)).not.toBeNull();
    expect(await sessionService.validateSession(s3.rawToken)).not.toBeNull();
    expect(await sessionService.validateSession(s4.rawToken)).not.toBeNull();
  });

  it('should list all active sessions for a user with isCurrent flag', async () => {
    const user = await db.users.findByUsername('session_tester');
    const s1 = await sessionService.createSession(user!.id, '10.0.0.1', 'Mozilla/5.0 Windows');
    const s2 = await sessionService.createSession(user!.id, '10.0.0.2', 'Mozilla/5.0 iPhone');

    const list = await sessionService.getUserActiveSessions(user!.id, s2.session.id);
    expect(list.length).toBe(2);

    const s2Dto = list.find((s) => s.id === s2.session.id);
    const s1Dto = list.find((s) => s.id === s1.session.id);

    expect(s2Dto?.isCurrent).toBe(true);
    expect(s1Dto?.isCurrent).toBe(false);
    expect(s1Dto?.device?.os).toBe('Windows');
    expect(s2Dto?.device?.os).toBe('iOS');
  });
});
