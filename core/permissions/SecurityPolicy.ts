/**
 * @file SecurityPolicy.ts
 * @description Centralized path protection rules, role policies, and system boundaries.
 */

import { RoleManager } from '../users/RoleManager.js';
import type { PermissionTarget, PermissionType, SecurityContext } from './types.js';

export class SecurityPolicy {
  /**
   * System protected root-level directories where ordinary users cannot write.
   */
  public static readonly SYSTEM_PROTECTED_PREFIXES = [
    '/system',
    '/bin',
    '/etc',
    '/applications',
    '/var/system',
  ] as const;

  /**
   * System directories that allow public / temporary write access.
   */
  public static readonly SHARED_WRITABLE_PREFIXES = ['/tmp', '/var/tmp'] as const;

  /**
   * Checks if a path is located in a protected system directory.
   */
  public static isSystemProtectedPath(path?: string): boolean {
    if (!path) return false;
    const normalized = path.replace(/\/+$/, '') || '/';
    return this.SYSTEM_PROTECTED_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
    );
  }

  /**
   * Checks if a path is located in a shared temporary/scratch directory.
   */
  public static isSharedWritablePath(path?: string): boolean {
    if (!path) return false;
    const normalized = path.replace(/\/+$/, '') || '/';
    return this.SHARED_WRITABLE_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
    );
  }

  /**
   * Evaluates if context and target satisfy high-level security policies.
   */
  public static evaluatePolicy(
    context: SecurityContext,
    target: PermissionTarget,
    permission: PermissionType
  ): { allowed: boolean; reason?: string } {
    // 1. Kernel / System internal bypass
    if (context.isSystem) {
      return { allowed: true };
    }

    // 2. Administrators have full access across the OS
    if (RoleManager.isAdmin(context.role)) {
      return { allowed: true };
    }

    const path = target.path;

    // 3. System Protected Paths (/system, /bin, /etc, /applications)
    if (path && this.isSystemProtectedPath(path)) {
      // Non-admins can READ system resources, but cannot WRITE or EXECUTE modifications
      if (permission === 'READ') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `System path '${path}' is protected and requires administrator privileges`,
      };
    }

    // 4. Guest account restrictions: Guests can read public files and write only to /tmp
    if (RoleManager.isGuest(context.role)) {
      if (permission === 'READ') {
        return { allowed: true };
      }
      if (permission === 'WRITE' && path && this.isSharedWritablePath(path)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Guest accounts have restricted write access and can only write to temporary directories`,
      };
    }

    // 5. Shared temporary directories (/tmp) are writable by all normal users
    if (path && this.isSharedWritablePath(path)) {
      return { allowed: true };
    }

    // Default policy allows node-level POSIX and ACL evaluation to proceed
    return { allowed: true };
  }
}
