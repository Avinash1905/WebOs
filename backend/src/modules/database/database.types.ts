/**
 * WebOS Backend - Module 2: Database Types and Domain Entities
 * Full TypeScript interfaces matching Prisma & domain data models
 */

import type { PaginatedResult, QueryOptions } from '../../repositories/query.types.js';

// ============================================================================
// Enums
// ============================================================================

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DEACTIVATED' | 'LOCKED';

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type SecuritySeverity = 'INFO' | 'WARN' | 'CRITICAL' | 'SECURITY_ALERT';

// ============================================================================
// Domain Entities
// ============================================================================

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  algorithm: string;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  lastLoginAt: Date | null;
  lastPasswordChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  locale: string;
  theme: string;
  wallpaper: string;
  desktopLayout: Record<string, unknown>;
  notificationPreferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleEntity {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  hierarchyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionEntity {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleEntity {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string | null;
}

export interface RolePermissionEntity {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: Date;
}

export interface SessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  status: SessionStatus;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDeviceEntity {
  id: string;
  sessionId: string;
  deviceType: string;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  cpuArchitecture: string | null;
  clientIdentifier: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthAttemptEntity {
  id: string;
  userId: string | null;
  identifier: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason: string | null;
  attemptedAt: Date;
}

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface EmailVerificationTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface SecurityEventEntity {
  id: string;
  userId: string | null;
  eventType: string;
  severity: SecuritySeverity;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
}

export interface LoginHistoryEntity {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  deviceSummary: string | null;
  loginAt: Date;
  logoutAt: Date | null;
}

// ============================================================================
// Filter / Search Criteria
// ============================================================================

export interface UserFilterCriteria {
  username?: string;
  email?: string;
  status?: UserStatus;
  emailVerified?: boolean;
  search?: string;
  createdBefore?: Date;
  createdAfter?: Date;
}

export interface RoleFilterCriteria {
  name?: string;
  isSystem?: boolean;
  minHierarchyLevel?: number;
  maxHierarchyLevel?: number;
}

export interface PermissionFilterCriteria {
  resource?: string;
  action?: string;
  name?: string;
}

export interface SessionFilterCriteria {
  userId?: string;
  status?: SessionStatus;
  activeOnly?: boolean;
  ipAddress?: string;
}

export interface SecurityEventFilterCriteria {
  userId?: string;
  eventType?: string;
  severity?: SecuritySeverity;
  since?: Date;
  until?: Date;
}

export interface AuthAttemptFilterCriteria {
  identifier?: string;
  ipAddress?: string;
  success?: boolean;
  since?: Date;
}

// ============================================================================
// Repository Extended Interfaces
// ============================================================================

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  findMany(options?: QueryOptions<UserEntity>): Promise<readonly UserEntity[]>;
  findPaginated(options?: QueryOptions<UserEntity>): Promise<PaginatedResult<UserEntity>>;
  count(filter?: UserFilterCriteria): Promise<number>;
  exists(id: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  create(entity: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  update(id: string, patch: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<boolean>;
  incrementFailedAttempts(id: string, lockoutUntil?: Date): Promise<void>;
  resetFailedAttempts(id: string): Promise<void>;
  updateLastLogin(id: string, timestamp: Date): Promise<void>;
}

export interface IUserProfileRepository {
  findById(id: string): Promise<UserProfileEntity | null>;
  findByUserId(userId: string): Promise<UserProfileEntity | null>;
  create(entity: Omit<UserProfileEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfileEntity>;
  update(id: string, patch: Partial<UserProfileEntity>): Promise<UserProfileEntity>;
  updateByUserId(userId: string, patch: Partial<UserProfileEntity>): Promise<UserProfileEntity>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<boolean>;
}

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  findMany(options?: QueryOptions<RoleEntity>): Promise<readonly RoleEntity[]>;
  count(filter?: RoleFilterCriteria): Promise<number>;
  exists(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  create(entity: Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoleEntity>;
  update(id: string, patch: Partial<RoleEntity>): Promise<RoleEntity>;
  delete(id: string): Promise<boolean>;
  findByUserId(userId: string): Promise<readonly RoleEntity[]>;
}

export interface IPermissionRepository {
  findById(id: string): Promise<PermissionEntity | null>;
  findByName(name: string): Promise<PermissionEntity | null>;
  findByResourceAndAction(resource: string, action: string): Promise<PermissionEntity | null>;
  findMany(options?: QueryOptions<PermissionEntity>): Promise<readonly PermissionEntity[]>;
  count(filter?: PermissionFilterCriteria): Promise<number>;
  exists(id: string): Promise<boolean>;
  create(entity: Omit<PermissionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PermissionEntity>;
  update(id: string, patch: Partial<PermissionEntity>): Promise<PermissionEntity>;
  delete(id: string): Promise<boolean>;
  findByRoleId(roleId: string): Promise<readonly PermissionEntity[]>;
  findByRoleIds(roleIds: readonly string[]): Promise<readonly PermissionEntity[]>;
  findByUserId(userId: string): Promise<readonly PermissionEntity[]>;
}

export interface IUserRoleRepository {
  assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRoleEntity>;
  removeRole(userId: string, roleId: string): Promise<boolean>;
  findByUserId(userId: string): Promise<readonly UserRoleEntity[]>;
  findByRoleId(roleId: string): Promise<readonly UserRoleEntity[]>;
  hasRole(userId: string, roleId: string): Promise<boolean>;
  removeAllUserRoles(userId: string): Promise<number>;
}

export interface IRolePermissionRepository {
  grantPermission(roleId: string, permissionId: string): Promise<RolePermissionEntity>;
  revokePermission(roleId: string, permissionId: string): Promise<boolean>;
  findByRoleId(roleId: string): Promise<readonly RolePermissionEntity[]>;
  hasPermission(roleId: string, permissionId: string): Promise<boolean>;
  removeAllRolePermissions(roleId: string): Promise<number>;
}

export interface ISessionRepository {
  findById(id: string): Promise<SessionEntity | null>;
  findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;
  findByUserId(userId: string, activeOnly?: boolean): Promise<readonly SessionEntity[]>;
  create(entity: Omit<SessionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionEntity>;
  update(id: string, patch: Partial<SessionEntity>): Promise<SessionEntity>;
  updateLastActive(id: string, timestamp: Date): Promise<void>;
  revokeSession(id: string, reason?: string): Promise<boolean>;
  revokeAllUserSessions(userId: string, exceptSessionId?: string, reason?: string): Promise<number>;
  deleteExpiredSessions(olderThan: Date): Promise<number>;
  countActiveByUserId(userId: string): Promise<number>;
}

export interface ISessionDeviceRepository {
  findById(id: string): Promise<SessionDeviceEntity | null>;
  findBySessionId(sessionId: string): Promise<SessionDeviceEntity | null>;
  create(entity: Omit<SessionDeviceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionDeviceEntity>;
  update(id: string, patch: Partial<SessionDeviceEntity>): Promise<SessionDeviceEntity>;
  deleteBySessionId(sessionId: string): Promise<boolean>;
}

export interface IAuthAttemptRepository {
  recordAttempt(attempt: Omit<AuthAttemptEntity, 'id' | 'attemptedAt'>): Promise<AuthAttemptEntity>;
  countRecentFailures(identifier: string, since: Date): Promise<number>;
  countRecentIpFailures(ipAddress: string, since: Date): Promise<number>;
  findRecent(options?: QueryOptions<AuthAttemptEntity>): Promise<readonly AuthAttemptEntity[]>;
  clearOldAttempts(olderThan: Date): Promise<number>;
}

export interface IPasswordResetTokenRepository {
  createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetTokenEntity>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null>;
  markAsUsed(id: string): Promise<void>;
  invalidateAllUserTokens(userId: string): Promise<number>;
  deleteExpired(olderThan: Date): Promise<number>;
}

export interface IEmailVerificationTokenRepository {
  createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationTokenEntity>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationTokenEntity | null>;
  markAsUsed(id: string): Promise<void>;
  invalidateAllUserTokens(userId: string): Promise<number>;
  deleteExpired(olderThan: Date): Promise<number>;
}

export interface ISecurityEventRepository {
  recordEvent(event: Omit<SecurityEventEntity, 'id' | 'occurredAt'>): Promise<SecurityEventEntity>;
  findRecentByUserId(userId: string, limit?: number): Promise<readonly SecurityEventEntity[]>;
  findMany(options?: QueryOptions<SecurityEventEntity>): Promise<readonly SecurityEventEntity[]>;
  count(filter?: SecurityEventFilterCriteria): Promise<number>;
}

export interface ILoginHistoryRepository {
  recordLogin(history: Omit<LoginHistoryEntity, 'id' | 'loginAt' | 'logoutAt'>): Promise<LoginHistoryEntity>;
  recordLogout(userId: string, ipAddress: string, logoutAt: Date): Promise<void>;
  findByUserId(userId: string, limit?: number): Promise<readonly LoginHistoryEntity[]>;
}

// ============================================================================
// Unit of Work / Transaction Manager
// ============================================================================

export interface IDatabaseTransaction {
  readonly users: IUserRepository;
  readonly profiles: IUserProfileRepository;
  readonly roles: IRoleRepository;
  readonly permissions: IPermissionRepository;
  readonly userRoles: IUserRoleRepository;
  readonly rolePermissions: IRolePermissionRepository;
  readonly sessions: ISessionRepository;
  readonly sessionDevices: ISessionDeviceRepository;
  readonly authAttempts: IAuthAttemptRepository;
  readonly passwordResetTokens: IPasswordResetTokenRepository;
  readonly emailVerificationTokens: IEmailVerificationTokenRepository;
  readonly securityEvents: ISecurityEventRepository;
  readonly loginHistories: ILoginHistoryRepository;
}

export interface ITransactionRunner {
  runTransaction<T>(operation: (tx: IDatabaseTransaction) => Promise<T>): Promise<T>;
}
