/**
 * WebOS Backend - Module 5: Authorization & RBAC Domain Service
 * Manages roles, granular permissions, role inheritance, and permission checking with caching.
 */

import { BaseService } from '../../services/base.service.js';
import type { ServiceContext } from '../../services/service.types.js';
import type {
  IRoleRepository,
  IPermissionRepository,
  IUserRoleRepository,
  IRolePermissionRepository,
  RoleEntity,
  PermissionEntity,
  UserRoleEntity
} from '../database/database.types.js';
import type { SecurityEventRecorder } from '../auth/security-events/security-event.recorder.js';
import { SYSTEM_ROLES, SYSTEM_PERMISSIONS } from './permission.catalog.js';
import { PermissionCache, defaultPermissionCache } from './permission.cache.js';
import { RoleHierarchyService, defaultRoleHierarchyService } from './role-hierarchy.service.js';
import type {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithPermissionsDto
} from './rbac.types.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../../common/errors/specific-errors.js';

export interface RbacServiceDependencies {
  readonly roles: IRoleRepository;
  readonly permissions: IPermissionRepository;
  readonly userRoles: IUserRoleRepository;
  readonly rolePermissions: IRolePermissionRepository;
  readonly securityEvents: SecurityEventRecorder;
  readonly cache?: PermissionCache;
  readonly hierarchy?: RoleHierarchyService;
}

export class RbacService extends BaseService {
  private readonly roles: IRoleRepository;
  private readonly permissions: IPermissionRepository;
  private readonly userRoles: IUserRoleRepository;
  private readonly rolePermissions: IRolePermissionRepository;
  private readonly securityEvents: SecurityEventRecorder;
  private readonly cache: PermissionCache;
  private readonly hierarchy: RoleHierarchyService;

  constructor(deps: RbacServiceDependencies, context: ServiceContext) {
    super(
      {
        name: 'RbacService',
        version: '1.0.0'
      },
      context
    );

    this.roles = deps.roles;
    this.permissions = deps.permissions;
    this.userRoles = deps.userRoles;
    this.rolePermissions = deps.rolePermissions;
    this.securityEvents = deps.securityEvents;
    this.cache = deps.cache ?? defaultPermissionCache;
    this.hierarchy = deps.hierarchy ?? defaultRoleHierarchyService;
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('Initializing RbacService and verifying system permission catalog...');
    await this.seedSystemRolesAndPermissions();
    this.logger.info('RbacService initialized successfully.');
  }

  protected async onShutdown(): Promise<void> {
    this.cache.invalidateAll();
    this.logger.info('RbacService shutdown complete.');
  }

  /**
   * Seeds system permissions and default roles if missing.
   */
  public async seedSystemRolesAndPermissions(): Promise<void> {
    // 1. Seed Permissions
    const permMap = new Map<string, PermissionEntity>();
    for (const def of SYSTEM_PERMISSIONS) {
      let perm = await this.permissions.findByName(def.name);
      if (!perm) {
        perm = await this.permissions.create({
          name: def.name,
          resource: def.resource,
          action: def.action,
          description: def.description,
          isSystem: true
        });
      }
      permMap.set(perm.name, perm);
    }

    // 2. Seed Roles and Grants
    for (const rDef of SYSTEM_ROLES) {
      let role = await this.roles.findByName(rDef.name);
      if (!role) {
        role = await this.roles.create({
          name: rDef.name,
          displayName: rDef.displayName,
          description: rDef.description,
          hierarchyLevel: rDef.hierarchyLevel,
          isSystem: rDef.isSystem
        });
      }

      // Ensure permissions are granted to this role
      for (const permName of rDef.permissions) {
        const perm = permMap.get(permName);
        if (perm) {
          const hasGrant = await this.rolePermissions.hasPermission(role.id, perm.id);
          if (!hasGrant) {
            await this.rolePermissions.grantPermission(role.id, perm.id);
          }
        }
      }
    }
  }

  public getHierarchy(): RoleHierarchyService {
    return this.hierarchy;
  }

  public async listRoles(): Promise<readonly RoleEntity[]> {
    return this.roles.findMany({ sort: { hierarchyLevel: 'desc' } });
  }

  public async listPermissions(): Promise<readonly PermissionEntity[]> {
    return this.permissions.findMany({ sort: { resource: 'asc' } });
  }

  public async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissionsDto> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    const perms = await this.permissions.findByRoleId(roleId);

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      hierarchyLevel: role.hierarchyLevel,
      permissions: perms.map((p) => ({
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };
  }

  public async createRole(
    dto: CreateRoleDto,
    actorId: string,
    ip: string
  ): Promise<RoleEntity> {
    const normalizedName = dto.name.toUpperCase().trim();
    const exists = await this.roles.existsByName(normalizedName);
    if (exists) {
      throw new ConflictError(`Role '${normalizedName}' already exists`);
    }

    const role = await this.roles.create({
      name: normalizedName,
      displayName: dto.displayName.trim(),
      description: dto.description.trim(),
      hierarchyLevel: dto.hierarchyLevel ?? 10,
      isSystem: false
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      for (const permId of dto.permissionIds) {
        const existsPerm = await this.permissions.exists(permId);
        if (existsPerm) {
          await this.rolePermissions.grantPermission(role.id, permId);
        }
      }
    }

    await this.securityEvents.record({
      userId: actorId,
      eventType: 'ROLE_CREATED',
      severity: 'INFO',
      ipAddress: ip,
      metadata: { roleId: role.id, roleName: role.name }
    });

    return role;
  }

  public async updateRole(
    roleId: string,
    dto: UpdateRoleDto,
    actorId: string,
    ip: string
  ): Promise<RoleEntity> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    const updated = await this.roles.update(roleId, {
      displayName: dto.displayName ?? role.displayName,
      description: dto.description ?? role.description,
      hierarchyLevel: dto.hierarchyLevel ?? role.hierarchyLevel
    });

    if (dto.permissionIds !== undefined) {
      await this.rolePermissions.removeAllRolePermissions(roleId);
      for (const permId of dto.permissionIds) {
        const existsPerm = await this.permissions.exists(permId);
        if (existsPerm) {
          await this.rolePermissions.grantPermission(roleId, permId);
        }
      }
      this.cache.invalidateAll();
    }

    await this.securityEvents.record({
      userId: actorId,
      eventType: 'ROLE_UPDATED',
      severity: 'INFO',
      ipAddress: ip,
      metadata: { roleId, roleName: role.name }
    });

    return updated;
  }

  public async deleteRole(
    roleId: string,
    actorId: string,
    ip: string
  ): Promise<boolean> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    if (role.isSystem) {
      throw new ForbiddenError(`Cannot delete built-in system role '${role.name}'`);
    }

    await this.rolePermissions.removeAllRolePermissions(roleId);
    const deleted = await this.roles.delete(roleId);
    this.cache.invalidateAll();

    await this.securityEvents.record({
      userId: actorId,
      eventType: 'ROLE_DELETED',
      severity: 'WARN',
      ipAddress: ip,
      metadata: { roleId, roleName: role.name }
    });

    return deleted;
  }

  public async assignRoleToUser(
    userId: string,
    roleNameOrId: string,
    assignedBy: string,
    ip: string
  ): Promise<UserRoleEntity> {
    let role = await this.roles.findById(roleNameOrId);
    if (!role) {
      role = await this.roles.findByName(roleNameOrId);
    }
    if (!role) {
      throw new NotFoundError('Role', roleNameOrId);
    }

    const assignment = await this.userRoles.assignRole(userId, role.id, assignedBy);
    this.cache.invalidate(userId);

    await this.securityEvents.record({
      userId,
      eventType: 'ROLE_ASSIGNED',
      severity: 'INFO',
      ipAddress: ip,
      metadata: { roleId: role.id, roleName: role.name, assignedBy }
    });

    return assignment;
  }

  public async removeRoleFromUser(
    userId: string,
    roleNameOrId: string,
    actorId: string,
    ip: string
  ): Promise<boolean> {
    let role = await this.roles.findById(roleNameOrId);
    if (!role) {
      role = await this.roles.findByName(roleNameOrId);
    }
    if (!role) {
      throw new NotFoundError('Role', roleNameOrId);
    }

    const removed = await this.userRoles.removeRole(userId, role.id);
    this.cache.invalidate(userId);

    await this.securityEvents.record({
      userId,
      eventType: 'ROLE_REMOVED',
      severity: 'INFO',
      ipAddress: ip,
      metadata: { roleId: role.id, roleName: role.name, actorId }
    });

    return removed;
  }

  /**
   * Retrieves all effective permissions for a user (with caching).
   */
  public async getUserPermissions(userId: string): Promise<readonly string[]> {
    const cached = this.cache.get(userId);
    if (cached) {
      return Array.from(cached.permissions);
    }

    const [userRoles, perms] = await Promise.all([
      this.roles.findByUserId(userId),
      this.permissions.findByUserId(userId)
    ]);

    // Admin has implicit wildcard access
    const isAdmin = userRoles.some((r) => r.name === 'ADMIN');
    let permNames: string[];

    if (isAdmin) {
      const allPerms = await this.permissions.findMany();
      permNames = allPerms.map((p) => p.name);
    } else {
      permNames = perms.map((p) => p.name);
    }

    this.cache.set(
      userId,
      permNames,
      userRoles.map((r) => r.name)
    );

    return permNames;
  }

  /**
   * Retrieves all roles assigned to a user.
   */
  public async getUserRoles(userId: string): Promise<readonly string[]> {
    const cached = this.cache.get(userId);
    if (cached) {
      return Array.from(cached.roles);
    }

    const roles = await this.roles.findByUserId(userId);
    const roleNames = roles.map((r) => r.name);

    // Warm cache permissions as well
    await this.getUserPermissions(userId);

    return roleNames;
  }

  public async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return perms.includes(permissionName);
  }

  public async hasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName.toUpperCase());
  }

  public async hasAnyPermission(userId: string, permissions: readonly string[]): Promise<boolean> {
    const userPerms = await this.getUserPermissions(userId);
    const permSet = new Set(userPerms);
    return permissions.some((p) => permSet.has(p));
  }

  public async hasAllPermissions(userId: string, permissions: readonly string[]): Promise<boolean> {
    const userPerms = await this.getUserPermissions(userId);
    const permSet = new Set(userPerms);
    return permissions.every((p) => permSet.has(p));
  }
}
