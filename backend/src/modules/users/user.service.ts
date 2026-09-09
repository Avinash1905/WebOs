/**
 * WebOS Backend - Module 4: User Management Service
 * Manages user accounts, desktop configurations, status transitions, and profiles.
 */

import { BaseService } from '../../services/base.service.js';
import type { ServiceContext } from '../../services/service.types.js';
import type {
  IUserRepository,
  IUserProfileRepository,
  IRoleRepository,
  IUserRoleRepository,
  ISessionRepository,
  UserEntity,
  UserProfileEntity
} from '../database/database.types.js';
import type { SecurityEventRecorder } from '../auth/security-events/security-event.recorder.js';
import type {
  UserDetailDto,
  UpdateUserProfileDto,
  UpdateDesktopPreferencesDto,
  UserStatusChangeDto
} from './user.types.js';
import type { UserQueryRequest } from './user.schemas.js';
import type { PaginatedResult } from '../../repositories/query.types.js';
import {
  NotFoundError,
  ForbiddenError
} from '../../common/errors/specific-errors.js';

export interface UserServiceDependencies {
  readonly users: IUserRepository;
  readonly profiles: IUserProfileRepository;
  readonly roles: IRoleRepository;
  readonly userRoles: IUserRoleRepository;
  readonly sessions: ISessionRepository;
  readonly securityEvents: SecurityEventRecorder;
}

export class UserService extends BaseService {
  private readonly users: IUserRepository;
  private readonly profiles: IUserProfileRepository;
  private readonly roles: IRoleRepository;
  private readonly userRoles: IUserRoleRepository;
  private readonly sessions: ISessionRepository;
  private readonly securityEvents: SecurityEventRecorder;

  constructor(deps: UserServiceDependencies, context: ServiceContext) {
    super(
      {
        name: 'UserService',
        version: '1.0.0'
      },
      context
    );

    this.users = deps.users;
    this.profiles = deps.profiles;
    this.roles = deps.roles;
    this.userRoles = deps.userRoles;
    this.sessions = deps.sessions;
    this.securityEvents = deps.securityEvents;
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('UserService initialized.');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('UserService shutdown.');
  }

  /**
   * Retrieves full user details including profile and assigned roles.
   */
  public async getUserById(userId: string): Promise<UserDetailDto> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const [profile, roles] = await Promise.all([
      this.profiles.findByUserId(userId),
      this.roles.findByUserId(userId)
    ]);

    return this.toDetailDto(
      user,
      profile,
      roles.map((r) => r.name)
    );
  }

  /**
   * Retrieves user details by username.
   */
  public async getUserByUsername(username: string): Promise<UserDetailDto> {
    const user = await this.users.findByUsername(username);
    if (!user) {
      throw new NotFoundError('User', username);
    }

    const [profile, roles] = await Promise.all([
      this.profiles.findByUserId(user.id),
      this.roles.findByUserId(user.id)
    ]);

    return this.toDetailDto(
      user,
      profile,
      roles.map((r) => r.name)
    );
  }

  /**
   * Search and list users with pagination.
   */
  public async listUsers(
    query: UserQueryRequest
  ): Promise<PaginatedResult<UserDetailDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filter = {
      search: query.search,
      status: query.status,
      emailVerified: query.emailVerified
    };

    const [users, total] = await Promise.all([
      this.users.findMany({
        filter,
        pagination: { page, limit, offset },
        sort: { createdAt: 'desc' }
      }),
      this.users.count(filter)
    ]);

    const items = await Promise.all(
      users.map(async (u) => {
        const [profile, roles] = await Promise.all([
          this.profiles.findByUserId(u.id),
          this.roles.findByUserId(u.id)
        ]);
        return this.toDetailDto(
          u,
          profile,
          roles.map((r) => r.name)
        );
      })
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Updates user profile fields (displayName, bio, avatarUrl, locale, theme).
   */
  public async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto
  ): Promise<UserProfileEntity> {
    const existing = await this.profiles.findByUserId(userId);
    if (!existing) {
      // Create if it doesn't exist
      return this.profiles.create({
        userId,
        displayName: dto.displayName ?? 'User',
        avatarUrl: dto.avatarUrl ?? null,
        bio: dto.bio ?? null,
        locale: dto.locale ?? 'en-US',
        theme: dto.theme ?? 'dark',
        wallpaper: dto.wallpaper ?? 'default-nebula.jpg',
        desktopLayout: {},
        notificationPreferences: {}
      });
    }

    return this.profiles.updateByUserId(userId, {
      displayName: dto.displayName ?? existing.displayName,
      avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : existing.avatarUrl,
      bio: dto.bio !== undefined ? dto.bio : existing.bio,
      locale: dto.locale ?? existing.locale,
      theme: dto.theme ?? existing.theme,
      wallpaper: dto.wallpaper ?? existing.wallpaper
    });
  }

  /**
   * Retrieves desktop preferences (desktop layout, wallpaper, theme, notifications).
   */
  public async getDesktopPreferences(userId: string): Promise<{
    wallpaper: string;
    theme: string;
    desktopLayout: Record<string, unknown>;
    notificationPreferences: Record<string, unknown>;
  }> {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) {
      return {
        wallpaper: 'default-nebula.jpg',
        theme: 'dark',
        desktopLayout: {},
        notificationPreferences: { email: true, sound: true }
      };
    }

    return {
      wallpaper: profile.wallpaper,
      theme: profile.theme,
      desktopLayout: profile.desktopLayout,
      notificationPreferences: profile.notificationPreferences
    };
  }

  /**
   * Updates desktop layout, wallpaper, theme, and notification preferences.
   */
  public async updateDesktopPreferences(
    userId: string,
    dto: UpdateDesktopPreferencesDto
  ): Promise<UserProfileEntity> {
    const existing = await this.profiles.findByUserId(userId);
    if (!existing) {
      return this.profiles.create({
        userId,
        displayName: 'User',
        avatarUrl: null,
        bio: null,
        locale: 'en-US',
        theme: dto.theme ?? 'dark',
        wallpaper: dto.wallpaper ?? 'default-nebula.jpg',
        desktopLayout: dto.desktopLayout ?? {},
        notificationPreferences: dto.notificationPreferences ?? {}
      });
    }

    return this.profiles.updateByUserId(userId, {
      wallpaper: dto.wallpaper ?? existing.wallpaper,
      theme: dto.theme ?? existing.theme,
      desktopLayout: dto.desktopLayout
        ? { ...existing.desktopLayout, ...dto.desktopLayout }
        : existing.desktopLayout,
      notificationPreferences: dto.notificationPreferences
        ? { ...existing.notificationPreferences, ...dto.notificationPreferences }
        : existing.notificationPreferences
    });
  }

  /**
   * Admin changes user account status (e.g. SUSPENDED, ACTIVE, DEACTIVATED).
   */
  public async changeUserStatus(
    userId: string,
    dto: UserStatusChangeDto,
    actorId: string,
    ipAddress: string
  ): Promise<UserEntity> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (userId === actorId && dto.status !== 'ACTIVE') {
      throw new ForbiddenError('Administrators cannot suspend or deactivate their own account');
    }

    const updated = await this.users.update(userId, {
      status: dto.status,
      lockoutUntil: dto.status === 'LOCKED' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
    });

    // If suspending or deactivating, revoke all active sessions immediately
    if (dto.status === 'SUSPENDED' || dto.status === 'DEACTIVATED' || dto.status === 'LOCKED') {
      await this.sessions.revokeAllUserSessions(userId, undefined, `Account status changed to ${dto.status}`);
    }

    await this.securityEvents.record({
      userId,
      eventType: 'USER_STATUS_CHANGED',
      severity: dto.status === 'ACTIVE' ? 'INFO' : 'WARN',
      ipAddress,
      metadata: { previousStatus: user.status, newStatus: dto.status, reason: dto.reason, actorId }
    });

    return updated;
  }

  /**
   * Delete user account and all associated resources.
   */
  public async deleteUser(
    userId: string,
    actorId: string,
    ipAddress: string
  ): Promise<boolean> {
    if (userId === actorId) {
      throw new ForbiddenError('Self-deletion of administrator account is prohibited');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Revoke all sessions
    await this.sessions.revokeAllUserSessions(userId, undefined, 'Account deletion');

    // Remove profile and roles
    await Promise.all([
      this.profiles.deleteByUserId(userId),
      this.userRoles.removeAllUserRoles(userId)
    ]);

    // Delete user
    const deleted = await this.users.delete(userId);

    await this.securityEvents.record({
      userId: null,
      eventType: 'USER_DELETED',
      severity: 'WARN',
      ipAddress,
      metadata: { deletedUserId: userId, username: user.username, actorId }
    });

    return deleted;
  }

  private toDetailDto(
    user: UserEntity,
    profile: UserProfileEntity | null,
    roles: readonly string[]
  ): UserDetailDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      failedLoginAttempts: user.failedLoginAttempts,
      lastLoginAt: user.lastLoginAt,
      lastPasswordChangeAt: user.lastPasswordChangeAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile,
      roles
    };
  }
}
