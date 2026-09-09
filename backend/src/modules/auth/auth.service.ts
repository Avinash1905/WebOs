/**
 * WebOS Backend - Module 3: Authentication Domain Service
 * Handles user registration, credentials verification, session generation,
 * password resets, email verification, and audit event recording.
 */

import { BaseService } from '../../services/base.service.js';
import type { ServiceContext } from '../../services/service.types.js';
import type {
  IUserRepository,
  IUserProfileRepository,
  IRoleRepository,
  IUserRoleRepository,
  ISessionRepository,
  ISessionDeviceRepository,
  IPasswordResetTokenRepository,
  IEmailVerificationTokenRepository,
  ILoginHistoryRepository,
  UserEntity,
  UserProfileEntity
} from '../database/database.types.js';
import type {
  RegisterDto,
  LoginDto,
  AuthSuccessResult,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  AuthSecurityContext,
  UserSummaryDto
} from './auth.types.js';
import { PasswordHasher, defaultPasswordHasher } from './crypto/password.hasher.js';
import { PasswordValidator, defaultPasswordValidator } from './crypto/password.validator.js';
import { TokenGenerator } from './crypto/token.generator.js';
import { LockoutManager } from './lockout/lockout.manager.js';
import { SecurityEventRecorder } from './security-events/security-event.recorder.js';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError
} from '../../common/errors/specific-errors.js';

export interface AuthServiceDependencies {
  readonly users: IUserRepository;
  readonly profiles: IUserProfileRepository;
  readonly roles: IRoleRepository;
  readonly userRoles: IUserRoleRepository;
  readonly sessions: ISessionRepository;
  readonly sessionDevices: ISessionDeviceRepository;
  readonly passwordResetTokens: IPasswordResetTokenRepository;
  readonly emailVerificationTokens: IEmailVerificationTokenRepository;
  readonly loginHistories: ILoginHistoryRepository;
  readonly lockoutManager: LockoutManager;
  readonly securityEvents: SecurityEventRecorder;
  readonly passwordHasher?: PasswordHasher;
  readonly passwordValidator?: PasswordValidator;
  readonly sessionDurationDays?: number;
}

export class AuthService extends BaseService {
  private readonly users: IUserRepository;
  private readonly profiles: IUserProfileRepository;
  private readonly roles: IRoleRepository;
  private readonly userRoles: IUserRoleRepository;
  private readonly sessions: ISessionRepository;
  private readonly passwordResetTokens: IPasswordResetTokenRepository;
  private readonly emailVerificationTokens: IEmailVerificationTokenRepository;
  private readonly loginHistories: ILoginHistoryRepository;
  private readonly lockoutManager: LockoutManager;
  private readonly securityEvents: SecurityEventRecorder;
  private readonly passwordHasher: PasswordHasher;
  private readonly passwordValidator: PasswordValidator;
  private readonly sessionDurationDays: number;

  constructor(deps: AuthServiceDependencies, context: ServiceContext) {
    super(
      {
        name: 'AuthService',
        version: '1.0.0'
      },
      context
    );

    this.users = deps.users;
    this.profiles = deps.profiles;
    this.roles = deps.roles;
    this.userRoles = deps.userRoles;
    this.sessions = deps.sessions;
    this.passwordResetTokens = deps.passwordResetTokens;
    this.emailVerificationTokens = deps.emailVerificationTokens;
    this.loginHistories = deps.loginHistories;
    this.lockoutManager = deps.lockoutManager;
    this.securityEvents = deps.securityEvents;
    this.passwordHasher = deps.passwordHasher ?? defaultPasswordHasher;
    this.passwordValidator = deps.passwordValidator ?? defaultPasswordValidator;
    this.sessionDurationDays = deps.sessionDurationDays ?? 7;
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('AuthService initialized successfully.');
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('AuthService shutdown complete.');
  }

  /**
   * Register a new user account.
   */
  public async register(
    dto: RegisterDto,
    context: AuthSecurityContext
  ): Promise<AuthSuccessResult> {
    const normalizedUsername = dto.username.toLowerCase().trim();
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check uniqueness
    const [existsUsername, existsEmail] = await Promise.all([
      this.users.existsByUsername(normalizedUsername),
      this.users.existsByEmail(normalizedEmail)
    ]);

    if (existsUsername) {
      throw new ConflictError(`Username '${dto.username}' is already taken`);
    }
    if (existsEmail) {
      throw new ConflictError(`Email '${dto.email}' is already registered`);
    }

    // 2. Validate password strength
    const strength = this.passwordValidator.validate(dto.password);
    if (!strength.isValid) {
      throw new ValidationError('Password does not meet security requirements', [
        { path: 'password', message: strength.feedback.join('. ') }
      ]);
    }

    // 3. Hash password
    const { hash, salt, algorithm } = await this.passwordHasher.hashPassword(dto.password);

    // 4. Create user
    const user = await this.users.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hash,
      salt,
      algorithm,
      status: 'ACTIVE', // Active by default for immediate usability
      emailVerified: false,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastPasswordChangeAt: new Date()
    });

    // 5. Create profile
    const profile = await this.profiles.create({
      userId: user.id,
      displayName: dto.displayName?.trim() || dto.username,
      avatarUrl: null,
      bio: null,
      locale: 'en-US',
      theme: 'dark',
      wallpaper: 'default-nebula.jpg',
      desktopLayout: {},
      notificationPreferences: { email: true, sound: true }
    });

    // 6. Assign default 'USER' role
    let userRole = await this.roles.findByName('USER');
    if (!userRole) {
      userRole = await this.roles.create({
        name: 'USER',
        displayName: 'Standard User',
        description: 'Default user role with standard desktop permissions',
        isSystem: true,
        hierarchyLevel: 10
      });
    }
    await this.userRoles.assignRole(user.id, userRole.id, 'system');

    // 7. Generate session
    const sessionToken = TokenGenerator.generateSessionToken();
    const tokenHash = TokenGenerator.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + this.sessionDurationDays * 24 * 60 * 60 * 1000);

    const session = await this.sessions.create({
      userId: user.id,
      tokenHash,
      status: 'ACTIVE',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      lastActiveAt: new Date(),
      expiresAt,
      revokedAt: null,
      revocationReason: null
    });

    // 8. Record audit events
    await this.securityEvents.record({
      userId: user.id,
      eventType: 'USER_REGISTERED',
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { username: user.username, email: user.email }
    });

    await this.loginHistories.recordLogin({
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      location: null,
      deviceSummary: null
    });

    return {
      user: this.toSummaryDto(user, profile, [userRole.name]),
      sessionToken,
      sessionId: session.id,
      expiresAt
    };
  }

  /**
   * Authenticate user with credentials and issue a new session.
   */
  public async login(
    dto: LoginDto,
    context: AuthSecurityContext
  ): Promise<AuthSuccessResult> {
    const identifier = dto.identifier.trim();

    // 1. Find user by username or email
    const user = await this.users.findByIdentifier(identifier);

    // 2. Check lockout status
    const lockout = await this.lockoutManager.checkLockout(user, context.ipAddress);
    if (lockout.isLocked) {
      const minutesRemaining = Math.ceil(lockout.remainingLockoutMs / (60 * 1000));
      await this.securityEvents.record({
        userId: user?.id,
        eventType: 'LOGIN_BLOCKED_LOCKOUT',
        severity: 'WARN',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { identifier, minutesRemaining }
      });
      throw new ForbiddenError(
        `Account is temporarily locked due to excessive failed attempts. Try again in ${minutesRemaining} minute(s).`
      );
    }

    // 3. User existence check
    if (!user) {
      await this.lockoutManager.recordFailure(null, identifier, context.ipAddress);
      await this.securityEvents.record({
        userId: null,
        eventType: 'LOGIN_FAILED_UNKNOWN_USER',
        severity: 'WARN',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { identifier }
      });
      throw new UnauthorizedError('Invalid username/email or password');
    }

    // 4. Verify password
    const isPasswordValid = await this.passwordHasher.verifyPassword(
      dto.password,
      user.passwordHash,
      user.salt,
      user.algorithm
    );

    if (!isPasswordValid) {
      const lockStatus = await this.lockoutManager.recordFailure(
        user,
        identifier,
        context.ipAddress
      );
      await this.securityEvents.record({
        userId: user.id,
        eventType: lockStatus.isLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED_BAD_PASSWORD',
        severity: lockStatus.isLocked ? 'CRITICAL' : 'WARN',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { identifier, failedAttempts: lockStatus.failedAttempts }
      });

      if (lockStatus.isLocked) {
        throw new ForbiddenError(
          'Too many failed attempts. Your account has been temporarily locked for security.'
        );
      }
      throw new UnauthorizedError('Invalid username/email or password');
    }

    // 5. Check account status
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended. Please contact system administration.');
    }
    if (user.status === 'DEACTIVATED') {
      throw new ForbiddenError('Your account is deactivated.');
    }
    if (user.status === 'LOCKED') {
      throw new ForbiddenError('Your account is locked.');
    }

    // 6. Reset failed attempts & record success
    await this.lockoutManager.resetOnSuccess(user.id);
    await this.users.updateLastLogin(user.id, new Date());

    // 7. Generate session
    const sessionToken = TokenGenerator.generateSessionToken();
    const tokenHash = TokenGenerator.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + this.sessionDurationDays * 24 * 60 * 60 * 1000);

    const session = await this.sessions.create({
      userId: user.id,
      tokenHash,
      status: 'ACTIVE',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      lastActiveAt: new Date(),
      expiresAt,
      revokedAt: null,
      revocationReason: null
    });

    // 8. Fetch profile & roles for summary
    const [profile, roles] = await Promise.all([
      this.profiles.findByUserId(user.id),
      this.roles.findByUserId(user.id)
    ]);

    // 9. Record audit events
    await this.securityEvents.record({
      userId: user.id,
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { sessionId: session.id }
    });

    await this.loginHistories.recordLogin({
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      location: null,
      deviceSummary: null
    });

    return {
      user: this.toSummaryDto(
        user,
        profile,
        roles.map((r) => r.name)
      ),
      sessionToken,
      sessionId: session.id,
      expiresAt
    };
  }

  /**
   * Log out an active session.
   */
  public async logout(
    sessionToken: string,
    userId?: string,
    context?: AuthSecurityContext
  ): Promise<void> {
    const tokenHash = TokenGenerator.hashToken(sessionToken);
    const session = await this.sessions.findByTokenHash(tokenHash);

    if (session && (!userId || session.userId === userId)) {
      const resolvedUserId = session.userId;
      await this.sessions.revokeSession(session.id, 'User logout');
      if (context) {
        await this.loginHistories.recordLogout(resolvedUserId, context.ipAddress, new Date());
        await this.securityEvents.record({
          userId: resolvedUserId,
          eventType: 'LOGOUT',
          severity: 'INFO',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { sessionId: session.id }
        });
      }
    }
  }

  /**
   * Request password reset token.
   */
  public async requestPasswordReset(
    dto: ForgotPasswordDto,
    context: AuthSecurityContext
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.users.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      // Return ambiguous message to prevent email enumeration
      return {
        message: 'If an account exists for this email, a password reset link has been dispatched.'
      };
    }

    // Invalidate existing tokens
    await this.passwordResetTokens.invalidateAllUserTokens(user.id);

    // Create 1-hour reset token
    const rawToken = TokenGenerator.generateUrlSafeToken(32);
    const tokenHash = TokenGenerator.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetTokens.createToken(user.id, tokenHash, expiresAt);

    await this.securityEvents.record({
      userId: user.id,
      eventType: 'PASSWORD_RESET_REQUESTED',
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return {
      message: 'If an account exists for this email, a password reset link has been dispatched.',
      resetToken: rawToken // Included in response for local / test environments
    };
  }

  /**
   * Complete password reset using token.
   */
  public async resetPassword(
    dto: ResetPasswordDto,
    context: AuthSecurityContext
  ): Promise<void> {
    const tokenHash = TokenGenerator.hashToken(dto.token);
    const record = await this.passwordResetTokens.findByTokenHash(tokenHash);

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ValidationError('Password reset token is invalid or has expired');
    }

    const strength = this.passwordValidator.validate(dto.newPassword);
    if (!strength.isValid) {
      throw new ValidationError('Password does not meet complexity requirements', [
        { path: 'newPassword', message: strength.feedback.join('. ') }
      ]);
    }

    const user = await this.users.findById(record.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const { hash, salt, algorithm } = await this.passwordHasher.hashPassword(dto.newPassword);
    await this.users.update(user.id, {
      passwordHash: hash,
      salt,
      algorithm,
      lastPasswordChangeAt: new Date()
    });

    // Mark token used
    await this.passwordResetTokens.markAsUsed(record.id);

    // Invalidate all active sessions to secure account
    await this.sessions.revokeAllUserSessions(user.id, undefined, 'Password reset');

    await this.securityEvents.record({
      userId: user.id,
      eventType: 'PASSWORD_RESET_COMPLETED',
      severity: 'WARN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  /**
   * Authenticated user password change.
   */
  public async changePassword(
    dto: ChangePasswordDto,
    context: AuthSecurityContext
  ): Promise<void> {
    const user = await this.users.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User', dto.userId);
    }

    // Verify current password
    const validCurrent = await this.passwordHasher.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
      user.salt,
      user.algorithm
    );

    if (!validCurrent) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    const strength = this.passwordValidator.validate(dto.newPassword);
    if (!strength.isValid) {
      throw new ValidationError('New password does not meet requirements', [
        { path: 'newPassword', message: strength.feedback.join('. ') }
      ]);
    }

    const { hash, salt, algorithm } = await this.passwordHasher.hashPassword(dto.newPassword);
    await this.users.update(user.id, {
      passwordHash: hash,
      salt,
      algorithm,
      lastPasswordChangeAt: new Date()
    });

    await this.securityEvents.record({
      userId: user.id,
      eventType: 'PASSWORD_CHANGED',
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  /**
   * Verify email address using verification token.
   */
  public async verifyEmail(
    dto: VerifyEmailDto,
    context: AuthSecurityContext
  ): Promise<void> {
    const tokenHash = TokenGenerator.hashToken(dto.token);
    const tokenRecord = await this.emailVerificationTokens.findByTokenHash(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new ValidationError('Email verification token is invalid or expired');
    }

    await this.users.update(tokenRecord.userId, {
      emailVerified: true,
      status: 'ACTIVE'
    });

    await this.emailVerificationTokens.markAsUsed(tokenRecord.id);

    await this.securityEvents.record({
      userId: tokenRecord.userId,
      eventType: 'EMAIL_VERIFIED',
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  private toSummaryDto(
    user: UserEntity,
    profile: UserProfileEntity | null,
    roles: readonly string[]
  ): UserSummaryDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      profile: profile
        ? {
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            locale: profile.locale,
            theme: profile.theme
          }
        : null,
      roles
    };
  }
}
