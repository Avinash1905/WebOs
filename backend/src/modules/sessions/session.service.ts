/**
 * WebOS Backend - Module 6: Session Management Domain Service
 * Handles multi-device session tracking, sliding window inactivity, and device parsing.
 */

import { BaseService } from '../../services/base.service.js';
import type { ServiceContext } from '../../services/service.types.js';
import type {
  ISessionRepository,
  ISessionDeviceRepository,
  IUserRepository,
  IRoleRepository,
  SessionEntity,
  UserEntity
} from '../database/database.types.js';
import type { SecurityEventRecorder } from '../auth/security-events/security-event.recorder.js';
import { DeviceParser } from './device-parser.js';
import { TokenGenerator } from '../auth/crypto/token.generator.js';
import type {
  SessionDto,
  SessionPolicyConfig,
  SessionDeviceDto
} from './session.types.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/specific-errors.js';

export const DEFAULT_SESSION_POLICY: SessionPolicyConfig = {
  maxLifetimeMs: 7 * 24 * 60 * 60 * 1000, // 7 days hard lifetime
  slidingWindowInactivityMs: 60 * 60 * 1000, // 1 hour inactivity window
  maxConcurrentSessionsPerUser: 10,
  touchThrottleMs: 60 * 1000 // Throttle DB touch updates to at most once per minute
};

export interface SessionServiceDependencies {
  readonly sessions: ISessionRepository;
  readonly sessionDevices: ISessionDeviceRepository;
  readonly users: IUserRepository;
  readonly roles: IRoleRepository;
  readonly securityEvents: SecurityEventRecorder;
  readonly policy?: Partial<SessionPolicyConfig>;
}

export class SessionService extends BaseService {
  private readonly sessions: ISessionRepository;
  private readonly sessionDevices: ISessionDeviceRepository;
  private readonly users: IUserRepository;
  private readonly roles: IRoleRepository;
  private readonly securityEvents: SecurityEventRecorder;
  private readonly policy: SessionPolicyConfig;
  private readonly lastTouchMap = new Map<string, number>();

  constructor(deps: SessionServiceDependencies, context: ServiceContext) {
    super(
      {
        name: 'SessionService',
        version: '1.0.0'
      },
      context
    );

    this.sessions = deps.sessions;
    this.sessionDevices = deps.sessionDevices;
    this.users = deps.users;
    this.roles = deps.roles;
    this.securityEvents = deps.securityEvents;
    this.policy = { ...DEFAULT_SESSION_POLICY, ...deps.policy };
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('SessionService initialized.');
  }

  protected async onShutdown(): Promise<void> {
    this.lastTouchMap.clear();
    this.logger.info('SessionService shutdown.');
  }

  /**
   * Creates a new authenticated session for a user on a given device.
   */
  public async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    clientIdentifier?: string
  ): Promise<{ session: SessionEntity; rawToken: string }> {
    // 1. Enforce concurrent session limits
    const activeSessions = await this.sessions.findByUserId(userId, true);
    if (activeSessions.length >= this.policy.maxConcurrentSessionsPerUser) {
      // Sort oldest first and revoke excess
      const sorted = [...activeSessions].sort(
        (a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime()
      );
      const toRevoke = sorted.slice(0, sorted.length - this.policy.maxConcurrentSessionsPerUser + 1);
      for (const s of toRevoke) {
        await this.sessions.revokeSession(s.id, 'Concurrent session limit exceeded');
      }
    }

    // 2. Generate cryptographically strong raw token and SHA-256 hash
    const rawToken = TokenGenerator.generateSessionToken();
    const tokenHash = TokenGenerator.hashToken(rawToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.policy.maxLifetimeMs);

    // 3. Create session record
    const session = await this.sessions.create({
      userId,
      tokenHash,
      status: 'ACTIVE',
      ipAddress,
      userAgent,
      lastActiveAt: now,
      expiresAt,
      revokedAt: null,
      revocationReason: null
    });

    // 4. Parse device and create session device record
    const deviceInfo = DeviceParser.parse(userAgent);
    await this.sessionDevices.create({
      sessionId: session.id,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      cpuArchitecture: deviceInfo.cpuArchitecture,
      clientIdentifier: clientIdentifier ?? null
    });

    return { session, rawToken };
  }

  /**
   * Validates a raw session token against the store, checking status and sliding expiry.
   */
  public async validateSession(rawToken: string): Promise<{
    session: SessionEntity;
    user: UserEntity;
    roles: readonly string[];
  } | null> {
    if (!rawToken || rawToken.trim().length < 16) {
      return null;
    }

    const tokenHash = TokenGenerator.hashToken(rawToken);
    const session = await this.sessions.findByTokenHash(tokenHash);

    if (!session || session.status !== 'ACTIVE') {
      return null;
    }

    const now = new Date();

    // Check absolute expiration
    if (session.expiresAt <= now) {
      await this.sessions.update(session.id, { status: 'EXPIRED' });
      return null;
    }

    // Check sliding window inactivity
    const timeSinceLastActive = now.getTime() - session.lastActiveAt.getTime();
    if (timeSinceLastActive > this.policy.slidingWindowInactivityMs) {
      await this.sessions.update(session.id, { status: 'EXPIRED' });
      return null;
    }

    // Check user account status
    const user = await this.users.findById(session.userId);
    if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED' || user.status === 'LOCKED') {
      return null;
    }

    // Fetch user roles
    const roles = await this.roles.findByUserId(user.id);

    // Throttled touch to reduce database write frequency
    await this.touchSession(session.id);

    return {
      session,
      user,
      roles: roles.map((r) => r.name)
    };
  }

  /**
   * Extends lastActiveAt with throttling.
   */
  public async touchSession(sessionId: string): Promise<void> {
    const now = Date.now();
    const lastTouch = this.lastTouchMap.get(sessionId) ?? 0;

    if (now - lastTouch >= this.policy.touchThrottleMs) {
      this.lastTouchMap.set(sessionId, now);
      await this.sessions.updateLastActive(sessionId, new Date(now));
    }
  }

  /**
   * Revoke a specific session.
   */
  public async revokeSession(
    sessionId: string,
    actorUserId: string,
    reason = 'User initiated revocation'
  ): Promise<boolean> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    // Ensure actor is owner or administrator
    if (session.userId !== actorUserId) {
      const actorRoles = await this.roles.findByUserId(actorUserId);
      const isAdmin = actorRoles.some((r) => r.name === 'ADMIN');
      if (!isAdmin) {
        throw new ForbiddenError('You can only revoke your own sessions');
      }
    }

    const revoked = await this.sessions.revokeSession(sessionId, reason);
    this.lastTouchMap.delete(sessionId);

    await this.securityEvents.record({
      userId: session.userId,
      eventType: 'SESSION_REVOKED',
      severity: 'INFO',
      ipAddress: session.ipAddress,
      metadata: { sessionId, revokedBy: actorUserId, reason }
    });

    return revoked;
  }

  /**
   * Revoke all other active sessions for a user (e.g. "Log out from all other devices").
   */
  public async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string
  ): Promise<number> {
    const revokedCount = await this.sessions.revokeAllUserSessions(
      userId,
      currentSessionId,
      'Revoked other active sessions'
    );

    await this.securityEvents.record({
      userId,
      eventType: 'SESSIONS_ALL_OTHER_REVOKED',
      severity: 'INFO',
      ipAddress: '127.0.0.1',
      metadata: { preservedSessionId: currentSessionId, revokedCount }
    });

    return revokedCount;
  }

  /**
   * Lists all active sessions for a user along with device summaries.
   */
  public async getUserActiveSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<readonly SessionDto[]> {
    const activeSessions = await this.sessions.findByUserId(userId, true);

    const sessionDtos: SessionDto[] = [];
    for (const s of activeSessions) {
      const device = await this.sessionDevices.findBySessionId(s.id);
      let deviceDto: SessionDeviceDto | null = null;

      if (device) {
        deviceDto = {
          id: device.id,
          deviceType: device.deviceType,
          browser: device.browser,
          browserVersion: device.browserVersion,
          os: device.os,
          osVersion: device.osVersion,
          cpuArchitecture: device.cpuArchitecture,
          clientIdentifier: device.clientIdentifier
        };
      }

      sessionDtos.push({
        id: s.id,
        userId: s.userId,
        status: s.status,
        ipAddress: s.ipAddress,
        isCurrent: s.id === currentSessionId,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        device: deviceDto
      });
    }

    return sessionDtos;
  }

  /**
   * Periodically cleans up expired or revoked sessions older than 30 days.
   */
  public async cleanupExpiredSessions(retentionDays = 30): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    return this.sessions.deleteExpiredSessions(cutoff);
  }
}
