/**
 * WebOS Backend - In-Memory RolePermission Repository
 */

import type { IRolePermissionRepository, RolePermissionEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryRolePermissionRepository implements IRolePermissionRepository {
  private readonly store = new Map<string, RolePermissionEntity>();

  public async grantPermission(roleId: string, permissionId: string): Promise<RolePermissionEntity> {
    const existing = await this.findGrant(roleId, permissionId);
    if (existing) {
      return { ...existing };
    }

    const id = IdUtils.generateUuid();
    const entity: RolePermissionEntity = {
      id,
      roleId,
      permissionId,
      grantedAt: new Date()
    };

    this.store.set(id, entity);
    return { ...entity };
  }

  public async revokePermission(roleId: string, permissionId: string): Promise<boolean> {
    const existing = await this.findGrant(roleId, permissionId);
    if (!existing) {
      return false;
    }
    return this.store.delete(existing.id);
  }

  public async findByRoleId(roleId: string): Promise<readonly RolePermissionEntity[]> {
    const results: RolePermissionEntity[] = [];
    for (const rp of this.store.values()) {
      if (rp.roleId === roleId) {
        results.push({ ...rp });
      }
    }
    return results;
  }

  public async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    return (await this.findGrant(roleId, permissionId)) !== null;
  }

  public async removeAllRolePermissions(roleId: string): Promise<number> {
    let count = 0;
    for (const [id, rp] of Array.from(this.store.entries())) {
      if (rp.roleId === roleId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
  }

  private async findGrant(roleId: string, permissionId: string): Promise<RolePermissionEntity | null> {
    for (const rp of this.store.values()) {
      if (rp.roleId === roleId && rp.permissionId === permissionId) {
        return rp;
      }
    }
    return null;
  }
}
