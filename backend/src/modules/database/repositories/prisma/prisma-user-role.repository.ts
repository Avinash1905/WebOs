/**
 * WebOS Backend - Prisma UserRole Repository
 */

import type { IUserRoleRepository, UserRoleEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaUserRoleRepository implements IUserRoleRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async assignRole(
    userId: string,
    roleId: string,
    assignedBy?: string
  ): Promise<UserRoleEntity> {
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId }
    });
    if (existing) {
      return this.mapToEntity(existing);
    }

    const record = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: assignedBy ?? null
      }
    });

    return this.mapToEntity(record);
  }

  public async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      await this.prisma.userRole.deleteMany({
        where: { userId, roleId }
      });
      return true;
    } catch {
      return false;
    }
  }

  public async findByUserId(userId: string): Promise<readonly UserRoleEntity[]> {
    const records = await this.prisma.userRole.findMany({
      where: { userId }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async findByRoleId(roleId: string): Promise<readonly UserRoleEntity[]> {
    const records = await this.prisma.userRole.findMany({
      where: { roleId }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async hasRole(userId: string, roleId: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: { userId, roleId }
    });
    return count > 0;
  }

  public async removeAllUserRoles(userId: string): Promise<number> {
    const result = await this.prisma.userRole.deleteMany({
      where: { userId }
    });
    return result.count;
  }

  private mapToEntity(record: any): UserRoleEntity {
    return {
      id: record.id,
      userId: record.userId,
      roleId: record.roleId,
      assignedAt: record.assignedAt,
      assignedBy: record.assignedBy
    };
  }
}
