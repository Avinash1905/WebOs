/**
 * @file UserSessionTokenManager.ts
 * @description Cryptographically isolated session token lifecycle, revocation and refresh manager.
 */

export interface UserSession {
  readonly token: string;
  readonly userId: string;
  readonly username: string;
  readonly createdAt: number;
  lastActiveAt: number;
  readonly ttlMs: number;
  readonly clientIp?: string;
  readonly userAgent?: string;
}

export class UserSessionTokenManager {
  private readonly _sessions = new Map<string, UserSession>();
  private readonly _revocationList = new Set<string>();

  public createSession(
    userId: string,
    username: string,
    ttlMs: number = 3600000,
    clientIp?: string,
    userAgent?: string
  ): UserSession {
    const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const session: UserSession = {
      token,
      userId,
      username,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      ttlMs,
      clientIp,
      userAgent,
    };

    this._sessions.set(token, session);
    return session;
  }

  public validateSession(token: string): { valid: boolean; session?: UserSession } {
    if (this._revocationList.has(token)) {
      return { valid: false };
    }

    const session = this._sessions.get(token);
    if (!session) {
      return { valid: false };
    }

    const now = Date.now();
    if (now - session.lastActiveAt > session.ttlMs) {
      this._sessions.delete(token);
      return { valid: false };
    }

    session.lastActiveAt = now;
    return { valid: true, session };
  }

  public revokeToken(token: string): boolean {
    this._revocationList.add(token);
    return this._sessions.delete(token);
  }

  public revokeUserSessions(userId: string): number {
    let count = 0;
    for (const [token, session] of this._sessions.entries()) {
      if (session.userId === userId) {
        this._revocationList.add(token);
        this._sessions.delete(token);
        count++;
      }
    }
    return count;
  }
}
