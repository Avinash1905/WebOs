/**
 * WebOS Backend - RBAC Service & Permission Cache Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase } from '../../../src/modules/database/repositories/in-memory/in-memory-database.js';
import { RbacService } from '../../../src/modules/rbac/rbac.service.js';
import { PermissionCache } from '../../../src/modules/rbac/permission.cache.js';
import { RoleHierarchyService } from '../../../src/modules/rbac/role-hierarchy.service.js';
import { SecurityEventRecorder } from '../../../src/modules/auth/security-events/security-event.recorder.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import { ForbiddenError, ConflictError } from '../../../src/common/errors/specific-errors.js';

describe('RbacService', () => {
  let db: InMemoryDatabase;
  let rbacService: RbacService;
  let cache: PermissionCache;
  let hierarchy: RoleHierarchyService;
  const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

  beforeEach(async () => {
    db = new InMemoryDatabase();
    const securityEvents = new SecurityEventRecorder(db.securityEvents, logger);
    cache = new PermissionCache({ ttlMs: 10000 });
    hierarchy = new RoleHierarchyService();

    rbacService = new RbacService(
      {
        roles: db.roles,
        permissions: db.permissions,
        userRoles: db.userRoles,
        rolePermissions: db.rolePermissions,
        securityEvents,
        cache,
        hierarchy
      },
      { logger }
    );

    await rbacService.initialize();
  });

  const ip = '127.0.0.1';

  it('should seed system permissions and roles on initialization', async () => {
    const roles = await rbacService.listRoles();
    const perms = await rbacService.listPermissions();

    expect(roles.length).toBeGreaterThanOrEqual(5);
    expect(perms.length).toBeGreaterThanOrEqual(15);

    const adminRole = await db.roles.findByName('ADMIN');
    expect(adminRole).not.toBeNull();
    expect(adminRole?.isSystem).toBe(true);
    expect(adminRole?.hierarchyLevel).toBe(100);

    const userRole = await db.roles.findByName('USER');
    expect(userRole).not.toBeNull();
  });

  it('should correctly assign roles to users and evaluate permissions', async () => {
    const userId = 'test-user-uuid-1';

    // Initially has no roles
    expect(await rbacService.hasRole(userId, 'USER')).toBe(false);
    expect(await rbacService.hasPermission(userId, 'files:read')).toBe(false);

    // Assign USER role
    await rbacService.assignRoleToUser(userId, 'USER', 'admin-id', ip);

    expect(await rbacService.hasRole(userId, 'USER')).toBe(true);
    expect(await rbacService.hasPermission(userId, 'files:read')).toBe(true);
    expect(await rbacService.hasPermission(userId, 'users:delete')).toBe(false);
  });

  it('should grant ADMIN wildcard access across all permissions', async () => {
    const adminUserId = 'admin-user-uuid';
    await rbacService.assignRoleToUser(adminUserId, 'ADMIN', 'system', ip);

    expect(await rbacService.hasPermission(adminUserId, 'users:delete')).toBe(true);
    expect(await rbacService.hasPermission(adminUserId, 'system:admin')).toBe(true);
    expect(await rbacService.hasPermission(adminUserId, 'files:manage')).toBe(true);
    expect(await rbacService.hasAllPermissions(adminUserId, ['users:create', 'users:delete'])).toBe(true);
  });

  it('should support custom role creation and permission mapping', async () => {
    const customRole = await rbacService.createRole(
      {
        name: 'MODERATOR',
        displayName: 'Community Moderator',
        description: 'Moderates user activity and sessions',
        hierarchyLevel: 40
      },
      'admin-id',
      ip
    );

    expect(customRole.name).toBe('MODERATOR');
    expect(customRole.isSystem).toBe(false);

    // Prevent duplicate role creation
    await expect(
      rbacService.createRole(
        {
          name: 'MODERATOR',
          displayName: 'Duplicate',
          description: 'Duplicate'
        },
        'admin-id',
        ip
      )
    ).rejects.toThrow(ConflictError);
  });

  it('should prevent deletion of system roles', async () => {
    const adminRole = await db.roles.findByName('ADMIN');
    expect(adminRole).not.toBeNull();

    await expect(
      rbacService.deleteRole(adminRole!.id, 'admin-id', ip)
    ).rejects.toThrow(ForbiddenError);
  });

  it('should allow deletion of non-system roles and invalidate cache', async () => {
    const customRole = await rbacService.createRole(
      {
        name: 'TEMP_ROLE',
        displayName: 'Temporary Role',
        description: 'Temporary',
        hierarchyLevel: 5
      },
      'admin-id',
      ip
    );

    const deleted = await rbacService.deleteRole(customRole.id, 'admin-id', ip);
    expect(deleted).toBe(true);
    expect(await db.roles.findById(customRole.id)).toBeNull();
  });

  it('should cache user permissions and invalidate on role assignment/removal', async () => {
    const userId = 'caching-test-user';
    await rbacService.assignRoleToUser(userId, 'USER', 'admin-id', ip);

    // First call primes cache
    const perms1 = await rbacService.getUserPermissions(userId);
    expect(cache.size).toBe(1);

    // Second call reads from cache
    const perms2 = await rbacService.getUserPermissions(userId);
    expect(perms1).toEqual(perms2);

    // Removing role invalidates cache entry
    await rbacService.removeRoleFromUser(userId, 'USER', 'admin-id', ip);
    expect(cache.get(userId)).toBeNull();

    // Re-check permissions reflect removal
    const perms3 = await rbacService.getUserPermissions(userId);
    expect(perms3.length).toBe(0);
  });

  it('should test RoleHierarchyService authority rules', () => {
    const adminRole = { id: '1', name: 'ADMIN', displayName: 'Admin', description: '', isSystem: true, hierarchyLevel: 100, createdAt: new Date(), updatedAt: new Date() };
    const operatorRole = { id: '2', name: 'OPERATOR', displayName: 'Op', description: '', isSystem: true, hierarchyLevel: 80, createdAt: new Date(), updatedAt: new Date() };
    const userRole = { id: '3', name: 'USER', displayName: 'User', description: '', isSystem: true, hierarchyLevel: 10, createdAt: new Date(), updatedAt: new Date() };

    expect(hierarchy.hasAuthority(adminRole, operatorRole)).toBe(true);
    expect(hierarchy.hasAuthority(operatorRole, adminRole)).toBe(false);
    expect(hierarchy.canManageUser([adminRole], [operatorRole])).toBe(true);
    expect(hierarchy.canManageUser([operatorRole], [adminRole])).toBe(false);
    expect(hierarchy.hasRequiredLevel([operatorRole, userRole], 50)).toBe(true);
    expect(hierarchy.hasRequiredLevel([userRole], 50)).toBe(false);
  });
});
