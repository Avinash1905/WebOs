/**
 * WebOS Backend - In-Memory UserRole Repository
 */

import type { IUserRoleRepository, UserRoleEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryUserRoleRepository implements IUserRoleRepository {
  private readonly store = new Map<string, UserRoleEntity>();

  public async assignRole(
    userId: string,
    roleId: string,
    assignedBy?: string
  ): Promise<UserRoleEntity> {
    const existing = await this.findAssignment(userId, roleId);
    if (existing) {
      return { ...existing };
    }

    const id = IdUtils.generateUuid();
    const entity: UserRoleEntity = {
      id,
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy: assignedBy ?? null
    };

    this.store.set(id, entity);
    return { ...entity };
  }

  public async removeRole(userId: string, roleId: string): Promise<boolean> {
    const existing = await this.findAssignment(userId, roleId);
    if (!existing) {
      return false;
    }
    return this.store.delete(existing.id);
  }

  public async findByUserId(userId: string): Promise<readonly UserRoleEntity[]> {
    const results: UserRoleEntity[] = [];
    for (const ur of this.store.values()) {
      if (ur.userId === userId) {
        results.push({ ...ur });
      }
    }
    return results;
  }

  public async findByRoleId(roleId: string): Promise<readonly UserRoleEntity[]> {
    const results: UserRoleEntity[] = [];
    for (const ur of this.store.values()) {
      if (ur.roleId === roleId) {
        results.push({ ...ur });
      }
    }
    return results;
  }

  public async hasRole(userId: string, roleId: string): Promise<boolean> {
    return (await this.findAssignment(userId, roleId)) !== null;
  }

  public async removeAllUserRoles(userId: string): Promise<number> {
    let count = 0;
    for (const [id, ur] of Array.from(this.store.entries())) {
      if (ur.userId === userId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
  }

  private async findAssignment(userId: string, roleId: string): Promise<UserRoleEntity | null> {
    for (const ur of this.store.values()) {
      if (ur.userId === userId && ur.roleId === roleId) {
        return ur;
      }
    }
    return null;
  }
}
