/**
 * WebOS Backend - Canonical System Permission & Role Catalog
 * Defines all built-in granular permissions and default role capabilities.
 */

import type { PermissionDefinition, RoleDefinition } from './rbac.types.js';

export const SYSTEM_PERMISSIONS: readonly PermissionDefinition[] = [
  // User permissions
  {
    name: 'users:read',
    resource: 'users',
    action: 'read',
    description: 'View user profiles and user listings'
  },
  {
    name: 'users:create',
    resource: 'users',
    action: 'create',
    description: 'Create new user accounts'
  },
  {
    name: 'users:update',
    resource: 'users',
    action: 'update',
    description: 'Update user details and statuses'
  },
  {
    name: 'users:delete',
    resource: 'users',
    action: 'delete',
    description: 'Delete user accounts and associated resources'
  },
  {
    name: 'users:manage',
    resource: 'users',
    action: 'manage',
    description: 'Full administrative control over users'
  },

  // Role permissions
  {
    name: 'roles:read',
    resource: 'roles',
    action: 'read',
    description: 'View roles and their permission assignments'
  },
  {
    name: 'roles:manage',
    resource: 'roles',
    action: 'manage',
    description: 'Create, edit, and assign roles'
  },

  // Permission permissions
  {
    name: 'permissions:read',
    resource: 'permissions',
    action: 'read',
    description: 'View system permissions'
  },
  {
    name: 'permissions:manage',
    resource: 'permissions',
    action: 'manage',
    description: 'Assign and modify permission matrices'
  },

  // Session permissions
  {
    name: 'sessions:read',
    resource: 'sessions',
    action: 'read',
    description: 'View active sessions and login histories'
  },
  {
    name: 'sessions:revoke',
    resource: 'sessions',
    action: 'revoke',
    description: 'Revoke active sessions for self or other users'
  },

  // System & Health permissions
  {
    name: 'system:view',
    resource: 'system',
    action: 'read',
    description: 'View system health, metrics, and diagnostics'
  },
  {
    name: 'system:admin',
    resource: 'system',
    action: 'admin',
    description: 'Execute system maintenance and kernel level commands'
  },

  // File System permissions
  {
    name: 'files:read',
    resource: 'files',
    action: 'read',
    description: 'Read virtual file system files and directories'
  },
  {
    name: 'files:write',
    resource: 'files',
    action: 'write',
    description: 'Create and edit virtual files and folders'
  },
  {
    name: 'files:delete',
    resource: 'files',
    action: 'delete',
    description: 'Delete virtual files and folders'
  },
  {
    name: 'files:manage',
    resource: 'files',
    action: 'manage',
    description: 'Full management of virtual filesystem including quotas'
  },

  // App & Desktop permissions
  {
    name: 'apps:run',
    resource: 'apps',
    action: 'run',
    description: 'Launch and run desktop applications'
  },
  {
    name: 'apps:install',
    resource: 'apps',
    action: 'install',
    description: 'Install and uninstall desktop applications'
  },
  {
    name: 'apps:manage',
    resource: 'apps',
    action: 'manage',
    description: 'App store and package distribution administration'
  },
  {
    name: 'settings:read',
    resource: 'settings',
    action: 'read',
    description: 'View desktop and system settings'
  },
  {
    name: 'settings:write',
    resource: 'settings',
    action: 'write',
    description: 'Modify desktop and user preferences'
  }
];

export const SYSTEM_ROLES: readonly RoleDefinition[] = [
  {
    name: 'ADMIN',
    displayName: 'Administrator',
    description: 'Superuser with unrestricted access across all WebOS services',
    hierarchyLevel: 100,
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map((p) => p.name)
  },
  {
    name: 'OPERATOR',
    displayName: 'System Operator',
    description: 'Operations manager with user management and monitoring access',
    hierarchyLevel: 80,
    isSystem: true,
    permissions: [
      'users:read',
      'users:update',
      'roles:read',
      'permissions:read',
      'sessions:read',
      'sessions:revoke',
      'system:view',
      'files:read',
      'files:write',
      'files:delete',
      'apps:run',
      'apps:install',
      'settings:read',
      'settings:write'
    ]
  },
  {
    name: 'POWER_USER',
    displayName: 'Power User',
    description: 'Advanced user with package installation and file management abilities',
    hierarchyLevel: 50,
    isSystem: true,
    permissions: [
      'files:read',
      'files:write',
      'files:delete',
      'apps:run',
      'apps:install',
      'sessions:read',
      'sessions:revoke',
      'settings:read',
      'settings:write'
    ]
  },
  {
    name: 'USER',
    displayName: 'Standard User',
    description: 'Default user with regular desktop, file, and application access',
    hierarchyLevel: 10,
    isSystem: true,
    permissions: [
      'files:read',
      'files:write',
      'apps:run',
      'sessions:read',
      'sessions:revoke',
      'settings:read',
      'settings:write'
    ]
  },
  {
    name: 'GUEST',
    displayName: 'Guest User',
    description: 'Restricted read-only access for visitor sessions',
    hierarchyLevel: 0,
    isSystem: true,
    permissions: ['files:read', 'apps:run', 'settings:read']
  }
];
