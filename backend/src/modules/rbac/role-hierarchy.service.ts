/**
 * WebOS Backend - Role Hierarchy Resolution Service
 * Evaluates role dominance, permission inheritance, and authority boundaries.
 */

import type { RoleEntity } from '../database/database.types.js';

export class RoleHierarchyService {
  /**
   * Determine whether role A has strictly higher or equal authority to role B.
   */
  public hasAuthority(roleA: RoleEntity, roleB: RoleEntity): boolean {
    return roleA.hierarchyLevel >= roleB.hierarchyLevel;
  }

  /**
   * Get the highest hierarchy level among a set of roles.
   */
  public getMaxHierarchyLevel(roles: readonly RoleEntity[]): number {
    if (roles.length === 0) return 0;
    return Math.max(...roles.map((r) => r.hierarchyLevel));
  }

  /**
   * Check if a set of user roles includes at least one role at or above the required hierarchy level.
   */
  public hasRequiredLevel(roles: readonly RoleEntity[], requiredLevel: number): boolean {
    return this.getMaxHierarchyLevel(roles) >= requiredLevel;
  }

  /**
   * Check if actor's roles outrank target user's roles.
   * Prevents lower-ranking operators from altering superusers.
   */
  public canManageUser(actorRoles: readonly RoleEntity[], targetRoles: readonly RoleEntity[]): boolean {
    const actorMax = this.getMaxHierarchyLevel(actorRoles);
    const targetMax = this.getMaxHierarchyLevel(targetRoles);
    return actorMax > targetMax;
  }
}

export const defaultRoleHierarchyService = new RoleHierarchyService();
