/**
 * WebOS Backend - User Management Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase } from '../../../src/modules/database/repositories/in-memory/in-memory-database.js';
import { UserService } from '../../../src/modules/users/user.service.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { LockoutManager } from '../../../src/modules/auth/lockout/lockout.manager.js';
import { SecurityEventRecorder } from '../../../src/modules/auth/security-events/security-event.recorder.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import { NotFoundError, ForbiddenError } from '../../../src/common/errors/specific-errors.js';

describe('UserService', () => {
  let db: InMemoryDatabase;
  let userService: UserService;
  let authService: AuthService;
  const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

  beforeEach(async () => {
    db = new InMemoryDatabase();
    const securityEvents = new SecurityEventRecorder(db.securityEvents, logger);
    const lockoutManager = new LockoutManager(db.users, db.authAttempts);

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

    userService = new UserService(
      {
        users: db.users,
        profiles: db.profiles,
        roles: db.roles,
        userRoles: db.userRoles,
        sessions: db.sessions,
        securityEvents
      },
      { logger }
    );

    await authService.initialize();
    await userService.initialize();
  });

  const secContext = { ipAddress: '127.0.0.1', userAgent: 'WebOSTestRunner/1.0' };

  it('should retrieve a user by ID including profile and roles', async () => {
    const reg = await authService.register(
      {
        username: 'frank_ocean',
        email: 'frank@webos.dev',
        password: 'Password123!@#',
        displayName: 'Frank Ocean'
      },
      secContext
    );

    const user = await userService.getUserById(reg.user.id);
    expect(user.id).toBe(reg.user.id);
    expect(user.username).toBe('frank_ocean');
    expect(user.email).toBe('frank@webos.dev');
    expect(user.profile?.displayName).toBe('Frank Ocean');
    expect(user.roles).toContain('USER');
  });

  it('should throw NotFoundError when user ID does not exist', async () => {
    await expect(userService.getUserById('non-existent-uuid')).rejects.toThrow(NotFoundError);
  });

  it('should update user profile information', async () => {
    const reg = await authService.register(
      {
        username: 'grace_hopper',
        email: 'grace@webos.dev',
        password: 'Password123!@#'
      },
      secContext
    );

    const updated = await userService.updateProfile(reg.user.id, {
      displayName: 'Admiral Grace Hopper',
      bio: 'Pioneer of computer programming',
      theme: 'cyberpunk',
      locale: 'en-US'
    });

    expect(updated.displayName).toBe('Admiral Grace Hopper');
    expect(updated.bio).toBe('Pioneer of computer programming');
    expect(updated.theme).toBe('cyberpunk');

    // Verify stored
    const fetched = await userService.getUserById(reg.user.id);
    expect(fetched.profile?.displayName).toBe('Admiral Grace Hopper');
    expect(fetched.profile?.theme).toBe('cyberpunk');
  });

  it('should retrieve and update desktop preferences', async () => {
    const reg = await authService.register(
      {
        username: 'helen_desktop',
        email: 'helen@webos.dev',
        password: 'Password123!@#'
      },
      secContext
    );

    const initial = await userService.getDesktopPreferences(reg.user.id);
    expect(initial.theme).toBe('dark');
    expect(initial.wallpaper).toBe('default-nebula.jpg');

    await userService.updateDesktopPreferences(reg.user.id, {
      wallpaper: 'neon-city.png',
      desktopLayout: {
        icons: [{ id: 'terminal', x: 20, y: 40 }]
      }
    });

    const updated = await userService.getDesktopPreferences(reg.user.id);
    expect(updated.wallpaper).toBe('neon-city.png');
    expect(updated.desktopLayout).toEqual({
      icons: [{ id: 'terminal', x: 20, y: 40 }]
    });
  });

  it('should paginate and search users', async () => {
    for (let i = 1; i <= 5; i++) {
      await authService.register(
        {
          username: `user_${i}`,
          email: `user_${i}@webos.dev`,
          password: 'Password123!@#'
        },
        secContext
      );
    }

    const page1 = await userService.listUsers({ page: 1, limit: 3 });
    expect(page1.items.length).toBe(3);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(2);
    expect(page1.hasNext).toBe(true);

    const searchResult = await userService.listUsers({ search: 'user_3', page: 1, limit: 10 });
    expect(searchResult.items.length).toBe(1);
    expect(searchResult.items[0]?.username).toBe('user_3');
  });

  it('should allow admin to suspend user and revoke active sessions', async () => {
    const reg = await authService.register(
      {
        username: 'suspicious_user',
        email: 'sus@webos.dev',
        password: 'Password123!@#'
      },
      secContext
    );

    // Verify session exists
    let activeSessions = await db.sessions.findByUserId(reg.user.id, true);
    expect(activeSessions.length).toBe(1);

    // Suspend user
    await userService.changeUserStatus(
      reg.user.id,
      { status: 'SUSPENDED', reason: 'Abusive behavior' },
      'admin-id',
      '127.0.0.1'
    );

    // Verify status is SUSPENDED
    const user = await userService.getUserById(reg.user.id);
    expect(user.status).toBe('SUSPENDED');

    // Verify active sessions revoked
    activeSessions = await db.sessions.findByUserId(reg.user.id, true);
    expect(activeSessions.length).toBe(0);
  });

  it('should prevent admin self-suspension', async () => {
    const adminReg = await authService.register(
      {
        username: 'sysadmin',
        email: 'admin@webos.dev',
        password: 'Password123!@#'
      },
      secContext
    );

    await expect(
      userService.changeUserStatus(
        adminReg.user.id,
        { status: 'SUSPENDED' },
        adminReg.user.id,
        '127.0.0.1'
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('should delete a user and cascade cleanup profile and roles', async () => {
    const reg = await authService.register(
      {
        username: 'to_delete_user',
        email: 'del@webos.dev',
        password: 'Password123!@#'
      },
      secContext
    );

    const deleted = await userService.deleteUser(reg.user.id, 'admin-id', '127.0.0.1');
    expect(deleted).toBe(true);

    await expect(userService.getUserById(reg.user.id)).rejects.toThrow(NotFoundError);
    expect(await db.profiles.findByUserId(reg.user.id)).toBeNull();
    expect((await db.userRoles.findByUserId(reg.user.id)).length).toBe(0);
  });
});
