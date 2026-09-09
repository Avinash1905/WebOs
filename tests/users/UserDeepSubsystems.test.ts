import { describe, expect, it } from 'vitest';
import {
  PAMAuthenticator,
  UserQuotaManager,
  ShadowPasswordManager,
  UserSessionTokenManager,
} from '../../core/users/index.js';

describe('Users Deep Subsystems', () => {
  it('PAMAuthenticator executes multi-module pipeline with REQUIRED and REQUISITE rules', async () => {
    const pam = new PAMAuthenticator();

    pam.addRule('AUTH', 'REQUIRED', {
      name: 'pam_unix',
      authenticate: (ctx) => ctx.username === 'alice' && ctx.credentials?.password === 'secret',
    });

    const success = await pam.executeFacility('AUTH', {
      username: 'alice',
      credentials: { password: 'secret' },
      data: new Map(),
    });
    expect(success).toBe(true);

    const fail = await pam.executeFacility('AUTH', {
      username: 'alice',
      credentials: { password: 'wrong' },
      data: new Map(),
    });
    expect(fail).toBe(false);
  });

  it('UserQuotaManager enforces hard limits and tracks grace period for soft limits', () => {
    const quotaMgr = new UserQuotaManager();

    quotaMgr.setQuota('user123', {
      blockSoftLimit: 1000,
      blockHardLimit: 2000,
      inodeSoftLimit: 10,
      inodeHardLimit: 20,
    });

    expect(quotaMgr.checkAllowance('user123', 500, 1).allowed).toBe(true);
    quotaMgr.allocate('user123', 500, 1);

    // Hard limit rejection
    expect(quotaMgr.checkAllowance('user123', 1600, 1).allowed).toBe(false);

    // Within hard limit but over soft limit
    expect(quotaMgr.checkAllowance('user123', 600, 1).allowed).toBe(true);
    quotaMgr.allocate('user123', 600, 1);

    const q = quotaMgr.getQuota('user123');
    expect(q?.usedBytes).toBe(1100);
    expect(q?.graceExpiresAt).toBeDefined();

    quotaMgr.release('user123', 300);
    expect(q?.usedBytes).toBe(800);
    expect(q?.graceExpiresAt).toBeUndefined();
  });

  it('ShadowPasswordManager verifies passwords, salts and updates correctly', () => {
    const shadow = new ShadowPasswordManager();

    shadow.createEntry('bob', 'P@ssword123');
    expect(shadow.verifyPassword('bob', 'P@ssword123')).toBe(true);
    expect(shadow.verifyPassword('bob', 'wrongPassword')).toBe(false);

    shadow.updatePassword('bob', 'NewPass456');
    expect(shadow.verifyPassword('bob', 'NewPass456')).toBe(true);
    expect(shadow.verifyPassword('bob', 'P@ssword123')).toBe(false);
  });

  it('UserSessionTokenManager creates, validates, refreshes and revokes session tokens', () => {
    const tokenMgr = new UserSessionTokenManager();

    const session = tokenMgr.createSession('user_1', 'alice', 5000);
    expect(session.token).toBeDefined();

    const validCheck = tokenMgr.validateSession(session.token);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.session?.username).toBe('alice');

    // Revoke token
    tokenMgr.revokeToken(session.token);
    expect(tokenMgr.validateSession(session.token).valid).toBe(false);

    // Batch revoke user sessions
    const s1 = tokenMgr.createSession('user_2', 'bob', 5000);
    const s2 = tokenMgr.createSession('user_2', 'bob', 5000);
    expect(tokenMgr.revokeUserSessions('user_2')).toBe(2);
    expect(tokenMgr.validateSession(s1.token).valid).toBe(false);
    expect(tokenMgr.validateSession(s2.token).valid).toBe(false);
  });
});
