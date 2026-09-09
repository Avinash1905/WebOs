/**
 * WebOS Backend - Prisma Permission Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IPermissionRepository, PermissionEntity, PermissionFilterCriteria } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';
import { QueryBuilder } from '../../query.builder.js';

export class PrismaPermissionRepository
  extends AbstractRepository<PermissionEntity, string, PermissionFilterCriteria>
  implements IPermissionRepository
{
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    super('Permission');
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<PermissionEntity | null> {
    const record = await this.prisma.permission.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByName(name: string): Promise<PermissionEntity | null> {
    const record = await this.prisma.permission.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByResourceAndAction(
    resource: string,
    action: string
  ): Promise<PermissionEntity | null> {
    const record = await this.prisma.permission.findFirst({
      where: {
        resource: { equals: resource, mode: 'insensitive' },
        action: { equals: action, mode: 'insensitive' }
      }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async exists(id: string): Promise<boolean> {
    const count = await this.prisma.permission.count({ where: { id } });
    return count > 0;
  }

  public async count(filter?: PermissionFilterCriteria): Promise<number> {
    const where = QueryBuilder.buildPermissionWhere(filter);
    return this.prisma.permission.count({ where });
  }

  public async findMany(
    options?: QueryOptions<PermissionEntity>
  ): Promise<readonly PermissionEntity[]> {
    const where = QueryBuilder.buildPermissionWhere(
      options?.filter as PermissionFilterCriteria | undefined
    );
    let orderBy: Record<string, 'asc' | 'desc'> | undefined;
    if (options?.sort) {
      const entries = Object.entries(options.sort);
      if (entries.length > 0) {
        const [field, order] = entries[0] as [string, 'asc' | 'desc'];
        orderBy = { [field]: order };
      }
    }

    const records = await this.prisma.permission.findMany({
      where,
      skip: options?.pagination?.offset,
      take: options?.pagination?.limit,
      orderBy
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  public async create(
    entity: Omit<PermissionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PermissionEntity> {
    const record = await this.prisma.permission.create({
      data: {
        name: entity.name,
        resource: entity.resource,
        action: entity.action,
        description: entity.description,
        isSystem: entity.isSystem
      }
    });
    return this.mapToEntity(record);
  }

  public async update(id: string, patch: Partial<PermissionEntity>): Promise<PermissionEntity> {
    const record = await this.prisma.permission.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.resource !== undefined && { resource: patch.resource }),
        ...(patch.action !== undefined && { action: patch.action }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.isSystem !== undefined && { isSystem: patch.isSystem })
      }
    });
    return this.mapToEntity(record);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.permission.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async findByRoleId(roleId: string): Promise<readonly PermissionEntity[]> {
    const grants = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }
    });
    return grants.map((g) => this.mapToEntity((g as Record<string, unknown>).permission as Record<string, unknown>));
  }

  public async findByRoleIds(roleIds: readonly string[]): Promise<readonly PermissionEntity[]> {
    const grants = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: true }
    });
    const seen = new Set<string>();
    const results: PermissionEntity[] = [];
    for (const g of grants) {
      const perm = (g as Record<string, unknown>).permission as Record<string, unknown> | undefined;
      if (perm && typeof perm.id === 'string' && !seen.has(perm.id)) {
        seen.add(perm.id);
        results.push(this.mapToEntity(perm));
      }
    }
    return results;
  }

  public async findByUserId(userId: string): Promise<readonly PermissionEntity[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId }
    });
    const roleIds = userRoles.map((ur) => (ur as Record<string, unknown>).roleId as string);
    return this.findByRoleIds(roleIds);
  }

  private mapToEntity(record: any): PermissionEntity {
    return {
      id: record.id,
      name: record.name,
      resource: record.resource,
      action: record.action,
      description: record.description,
      isSystem: record.isSystem,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
