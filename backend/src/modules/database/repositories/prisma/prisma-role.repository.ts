/**
 * WebOS Backend - Prisma Role Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IRoleRepository, RoleEntity, RoleFilterCriteria } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';
import { QueryBuilder } from '../../query.builder.js';

export class PrismaRoleRepository
  extends AbstractRepository<RoleEntity, string, RoleFilterCriteria>
  implements IRoleRepository
{
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    super('Role');
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<RoleEntity | null> {
    const record = await this.prisma.role.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByName(name: string): Promise<RoleEntity | null> {
    const record = await this.prisma.role.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async exists(id: string): Promise<boolean> {
    const count = await this.prisma.role.count({ where: { id } });
    return count > 0;
  }

  public async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    return count > 0;
  }

  public async count(filter?: RoleFilterCriteria): Promise<number> {
    const where = QueryBuilder.buildRoleWhere(filter);
    return this.prisma.role.count({ where });
  }

  public async findMany(options?: QueryOptions<RoleEntity>): Promise<readonly RoleEntity[]> {
    const where = QueryBuilder.buildRoleWhere(options?.filter as RoleFilterCriteria | undefined);
    let orderBy: Record<string, 'asc' | 'desc'> | undefined;
    if (options?.sort) {
      const entries = Object.entries(options.sort);
      if (entries.length > 0) {
        const [field, order] = entries[0] as [string, 'asc' | 'desc'];
        orderBy = { [field]: order };
      }
    }

    const records = await this.prisma.role.findMany({
      where,
      skip: options?.pagination?.offset,
      take: options?.pagination?.limit,
      orderBy
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  public async create(
    entity: Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RoleEntity> {
    const record = await this.prisma.role.create({
      data: {
        name: entity.name,
        displayName: entity.displayName,
        description: entity.description,
        isSystem: entity.isSystem,
        hierarchyLevel: entity.hierarchyLevel
      }
    });
    return this.mapToEntity(record);
  }

  public async update(id: string, patch: Partial<RoleEntity>): Promise<RoleEntity> {
    const record = await this.prisma.role.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.isSystem !== undefined && { isSystem: patch.isSystem }),
        ...(patch.hierarchyLevel !== undefined && { hierarchyLevel: patch.hierarchyLevel })
      }
    });
    return this.mapToEntity(record);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.role.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async findByUserId(userId: string): Promise<readonly RoleEntity[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });
    return userRoles.map((ur: any) => this.mapToEntity(ur.role));
  }

  private mapToEntity(record: any): RoleEntity {
    return {
      id: record.id,
      name: record.name,
      displayName: record.displayName,
      description: record.description,
      isSystem: record.isSystem,
      hierarchyLevel: record.hierarchyLevel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
