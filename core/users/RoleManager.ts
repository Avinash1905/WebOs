/**
 * @file RoleManager.ts
 * @description Role definitions, hierarchy checks, and capability validation for WebOS.
 */

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

/**
 * Role hierarchy and capability helper.
 */
export class RoleManager {
  /**
   * Checks if a role has administrator-level privileges.
   */
  public static isAdmin(role?: string): boolean {
    return role?.toUpperCase() === USER_ROLES.ADMIN;
  }

  /**
   * Checks if a role is a guest account with restricted privileges.
   */
  public static isGuest(role?: string): boolean {
    return role?.toUpperCase() === USER_ROLES.GUEST;
  }

  /**
   * Checks if a role is a standard user.
   */
  public static isStandardUser(role?: string): boolean {
    return role?.toUpperCase() === USER_ROLES.USER;
  }

  /**
   * Validates if a role string is non-empty and well-formed.
   */
  public static isValidRole(role: string): boolean {
    return typeof role === 'string' && role.trim().length > 0;
  }

  /**
   * Determines if callerRole can modify targetRole (e.g. Admin can modify anyone, user can only modify non-admins).
   */
  public static canModify(callerRole: string, targetRole: string): boolean {
    if (this.isAdmin(callerRole)) {
      return true;
    }
    // Non-admins cannot modify admins or other users
    if (this.isAdmin(targetRole)) {
      return false;
    }
    return false;
  }
}
