/**
 * @file types.ts
 * @description Type definitions for the WebOS Permission & Security Engine.
 */

import type { EventBus } from '../events/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { UserManager, UserRole } from '../users/index.js';

/**
 * Basic permission types supported on filesystem nodes and OS resources.
 */
export type PermissionType = 'READ' | 'WRITE' | 'EXECUTE';

/**
 * Numeric bitmask flags for POSIX-style permission calculation.
 */
export const PERMISSION_FLAGS = {
  EXECUTE: 1, // 001
  WRITE: 2,   // 010
  READ: 4,    // 100
} as const;

/**
 * Standard POSIX octal modes for default filesystem nodes.
 */
export const DEFAULT_MODES = {
  FILE: 0o644,         // rw-r--r--
  DIRECTORY: 0o755,    // rwxr-xr-x
  PRIVATE_FILE: 0o600, // rw-------
  PRIVATE_DIR: 0o700,  // rwx------
} as const;

/**
 * Security context representing the caller executing an OS operation.
 */
export interface SecurityContext {
  /** User ID of the caller */
  readonly userId: string;
  /** Role of the caller */
  readonly role?: UserRole;
  /** If true, elevated kernel/system-level operation bypassing standard user checks */
  readonly isSystem?: boolean;
}

/**
 * Permission descriptor for a specific filesystem node or resource.
 */
export interface FilePermissions {
  /** Node or resource identifier */
  readonly targetId: string;
  /** Owner user ID */
  readonly ownerId: string;
  /** Optional group identifier */
  readonly groupId?: string;
  /** POSIX octal mode (e.g. 0o755, 0o644) */
  readonly mode: number;
  /** Per-user custom access control list: userId -> PermissionType[] */
  readonly acl?: Readonly<Record<string, readonly PermissionType[]>>;
}

/**
 * Target descriptor for permission evaluations.
 */
export interface PermissionTarget {
  /** Unique node identifier if known */
  readonly id?: string;
  /** Normalized path in VFS */
  readonly path?: string;
  /** Owner user ID if known */
  readonly ownerId?: string;
  /** Explicit permission mode */
  readonly mode?: number;
  /** Whether the target is a directory */
  readonly isDirectory?: boolean;
  /** Pre-existing node permissions if known */
  readonly permissions?: FilePermissions;
}

/**
 * Result returned from a permission check.
 */
export interface PermissionResult {
  /** Whether the requested operation is permitted */
  readonly allowed: boolean;
  /** Reason for denial if allowed is false */
  readonly reason?: string;
}

/**
 * Configuration options for the PermissionManager service.
 */
export interface PermissionManagerConfig {
  readonly storage?: StorageEngine;
  readonly eventBus?: EventBus;
  readonly userManager?: UserManager;
}
