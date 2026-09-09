/**
 * @file types.ts
 * @description Type definitions for the WebOS Local User and Session System.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { StorageEngine } from '../storage/index.js';

/**
 * Standard WebOS user roles.
 */
export type UserRole = 'ADMIN' | 'USER' | 'GUEST' | (string & {});

/**
 * Descriptor for a local OS user.
 */
export interface User {
  /** Unique UUID or user identifier */
  readonly id: string;
  /** Unique username identifier (e.g. 'alice', 'admin') */
  readonly username: string;
  /** Human-readable display name */
  readonly displayName: string;
  /** Assigned system role */
  readonly role: UserRole;
  /** Path to user home directory in VFS (e.g. '/home/alice') */
  readonly homeDirectory: string;
  /** Custom user preferences (theme, wallpaper, locale, etc.) */
  readonly preferences: Readonly<Record<string, unknown>>;
  /** Creation timestamp in milliseconds */
  readonly createdAt: number;
  /** Last update timestamp in milliseconds */
  readonly updatedAt: number;
  /** Whether the user is a protected system account */
  readonly isProtected?: boolean;
}

/**
 * Options when creating a new local user.
 */
export interface CreateUserOptions {
  /** Desired unique username */
  readonly username: string;
  /** Optional display name (defaults to username) */
  readonly displayName?: string;
  /** Role to assign (defaults to 'USER') */
  readonly role?: UserRole;
  /** Custom home directory path (defaults to '/home/<username>') */
  readonly homeDirectory?: string;
  /** Initial preferences object */
  readonly preferences?: Record<string, unknown>;
  /** Whether to mark account as protected from deletion */
  readonly isProtected?: boolean;
  /** If true, automatically provisions home directory and standard subdirectories */
  readonly provisionHomeDirectory?: boolean;
}

/**
 * Options when updating an existing user.
 */
export interface UpdateUserOptions {
  readonly displayName?: string;
  readonly role?: UserRole;
  readonly preferences?: Record<string, unknown>;
}

/**
 * Options when deleting a user.
 */
export interface DeleteUserOptions {
  /** If true, bypasses protection check for system users */
  readonly force?: boolean;
  /** If true, deletes user's home directory in VFS */
  readonly removeHomeDirectory?: boolean;
}

/**
 * Lifecycle status of an active or terminated session.
 */
export type SessionStatus = 'ACTIVE' | 'INACTIVE' | 'ENDED';

/**
 * Descriptor for an OS user session.
 */
export interface Session {
  /** Unique session UUID */
  readonly sessionId: string;
  /** ID of the authenticated user */
  readonly userId: string;
  /** Username of the authenticated user */
  readonly username: string;
  /** Role of the user in this session */
  readonly role: UserRole;
  /** Current session status */
  readonly status: SessionStatus;
  /** Session start timestamp */
  readonly createdAt: number;
  /** Last activity timestamp */
  readonly lastActiveAt: number;
  /** Optional expiration timestamp */
  readonly expiresAt?: number;
  /** Custom session metadata */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Filter options when listing sessions.
 */
export interface SessionFilter {
  readonly userId?: string;
  readonly status?: SessionStatus;
  readonly limit?: number;
}

/**
 * Configuration options for the UserManager service.
 */
export interface UserManagerConfig {
  readonly storage?: StorageEngine;
  readonly eventBus?: EventBus;
  readonly fileSystem?: FileSystem;
  /** If false, does not create default 'admin', 'user', 'guest' accounts on first boot */
  readonly createDefaultUsers?: boolean;
  /** Default session duration in milliseconds (default 24h, 0 for indefinite) */
  readonly sessionDurationMs?: number;
}
