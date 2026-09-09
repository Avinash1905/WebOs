/**
 * WebOS Backend - Module 5: Authorization & RBAC Types
 */

export type SystemRoleType =
  | 'ADMIN'
  | 'OPERATOR'
  | 'POWER_USER'
  | 'USER'
  | 'GUEST'
  | 'SERVICE_ACCOUNT';

export interface PermissionDefinition {
  readonly name: string;
  readonly resource: string;
  readonly action: string;
  readonly description: string;
}

export interface RoleDefinition {
  readonly name: SystemRoleType | string;
  readonly displayName: string;
  readonly description: string;
  readonly hierarchyLevel: number;
  readonly isSystem: boolean;
  readonly permissions: readonly string[];
}

export interface RoleWithPermissionsDto {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  hierarchyLevel: number;
  permissions: readonly PermissionDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

export interface GrantPermissionDto {
  roleId: string;
  permissionId: string;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description: string;
  hierarchyLevel?: number;
  permissionIds?: readonly string[];
}

export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  hierarchyLevel?: number;
  permissionIds?: readonly string[];
}
