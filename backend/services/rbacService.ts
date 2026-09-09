/**
 * WebOS Backend - Role-Based Access Control (RBAC) & ACL Permission Matrix
 */

export type WebOSPermission =
  | 'system:power'
  | 'system:admin'
  | 'vfs:read'
  | 'vfs:write'
  | 'vfs:delete'
  | 'process:spawn'
  | 'process:kill'
  | 'network:raw_socket'
  | 'network:http'
  | 'database:read'
  | 'database:write'
  | 'audit:read'
  | 'settings:modify';

export interface UserRoleDefinition {
  name: string;
  inherits?: string[];
  permissions: Set<WebOSPermission>;
}

export class RBACService {
  private static instance: RBACService;
  private roles: Map<string, UserRoleDefinition> = new Map();

  private constructor() {
    this.initializeDefaultRoles();
  }

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  private initializeDefaultRoles(): void {
    // Guest Role
    this.roles.set('guest', {
      name: 'guest',
      permissions: new Set(['vfs:read', 'network:http', 'process:spawn']),
    });

    // Standard User / Developer Role
    this.roles.set('developer', {
      name: 'developer',
      inherits: ['guest'],
      permissions: new Set([
        'vfs:read',
        'vfs:write',
        'process:spawn',
        'process:kill',
        'network:http',
        'database:read',
        'database:write',
        'settings:modify',
      ]),
    });

    // Administrator / Root
    this.roles.set('admin', {
      name: 'admin',
      inherits: ['developer'],
      permissions: new Set([
        'system:power',
        'system:admin',
        'vfs:read',
        'vfs:write',
        'vfs:delete',
        'process:spawn',
        'process:kill',
        'network:raw_socket',
        'network:http',
        'database:read',
        'database:write',
        'audit:read',
        'settings:modify',
      ]),
    });
  }

  public hasPermission(roleName: string, permission: WebOSPermission): boolean {
    const role = this.roles.get(roleName);
    if (!role) return false;

    if (role.permissions.has(permission)) return true;

    if (role.inherits) {
      for (const parentRole of role.inherits) {
        if (this.hasPermission(parentRole, permission)) return true;
      }
    }

    return false;
  }

  public getRolePermissions(roleName: string): WebOSPermission[] {
    const perms = new Set<WebOSPermission>();
    const collect = (rName: string) => {
      const r = this.roles.get(rName);
      if (!r) return;
      r.permissions.forEach((p) => perms.add(p));
      if (r.inherits) {
        r.inherits.forEach(collect);
      }
    };
    collect(roleName);
    return Array.from(perms);
  }
}

export const rbacService = RBACService.getInstance();
