/**
 * @file SessionLifecycleCoordinator.ts
 * @description Advanced user session coordinator tracking activity heartbeats, concurrent session limits, and serialization.
 */

import type { Session } from './types.js';
import type { UserManager } from './UserManager.js';

export interface SessionConfig {
  readonly maxConcurrentSessionsPerUser: number;
  readonly inactivityTimeoutMs: number;
}

export class SessionLifecycleCoordinator {
  private readonly config: SessionConfig;
  private readonly activeHeartbeats = new Map<string, number>();

  constructor(
    private readonly userManager: UserManager,
    config?: Partial<SessionConfig>
  ) {
    this.config = {
      maxConcurrentSessionsPerUser: config?.maxConcurrentSessionsPerUser ?? 5,
      inactivityTimeoutMs: config?.inactivityTimeoutMs ?? 30 * 60 * 1000 // 30 mins
    };
  }

  public async recordActivity(sessionId: string): Promise<boolean> {
    const session = await this.userManager.getSession(sessionId);
    if (!session || session.status !== 'ACTIVE') return false;

    this.activeHeartbeats.set(sessionId, Date.now());
    return true;
  }

  public async sweepInactiveSessions(): Promise<string[]> {
    const now = Date.now();
    const activeSessions = await this.userManager.listSessions({ status: 'ACTIVE' });
    const expiredSessionIds: string[] = [];

    for (const session of activeSessions) {
      const lastActive = this.activeHeartbeats.get(session.sessionId) ?? session.lastActiveAt;
      if (now - lastActive > this.config.inactivityTimeoutMs) {
        await this.userManager.endSession(session.sessionId);
        this.activeHeartbeats.delete(session.sessionId);
        expiredSessionIds.push(session.sessionId);
      }
    }

    return expiredSessionIds;
  }

  public async enforceConcurrencyLimit(userId: string): Promise<readonly Session[]> {
    const userSessions = (await this.userManager.listSessions({ userId, status: 'ACTIVE' }))
      .sort((a, b) => a.createdAt - b.createdAt); // oldest first

    const excess = userSessions.length - this.config.maxConcurrentSessionsPerUser;
    if (excess > 0) {
      const toEnd = userSessions.slice(0, excess);
      for (const s of toEnd) {
        await this.userManager.endSession(s.sessionId);
      }
      return toEnd;
    }

    return [];
  }
}
