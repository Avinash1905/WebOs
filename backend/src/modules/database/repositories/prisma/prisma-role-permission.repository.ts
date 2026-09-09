/**
 * WebOS Backend - Prisma RolePermission Repository
 */

import type { IRolePermissionRepository, RolePermissionEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaRolePermissionRepository implements IRolePermissionRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async grantPermission(
    roleId: string,
    permissionId: string
  ): Promise<RolePermissionEntity> {
    const existing = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId }
    });
    if (existing) {
      return this.mapToEntity(existing);
    }

    const record = await this.prisma.rolePermission.create({
      data: { roleId, permissionId }
    });

    return this.mapToEntity(record);
  }

  public async revokePermission(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId, permissionId }
      });
      return true;
    } catch {
      return false;
    }
  }

  public async findByRoleId(roleId: string): Promise<readonly RolePermissionEntity[]> {
    const records = await this.prisma.rolePermission.findMany({
      where: { roleId }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: { roleId, permissionId }
    });
    return count > 0;
  }

  public async removeAllRolePermissions(roleId: string): Promise<number> {
    const result = await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    });
    return result.count;
  }

  private mapToEntity(record: any): RolePermissionEntity {
    return {
      id: record.id,
      roleId: record.roleId,
      permissionId: record.permissionId,
      grantedAt: record.grantedAt
    };
  }
}
