/**
 * WebOS Backend - Prisma User Repository
 * PostgreSQL adapter implementing IUserRepository using Prisma Client.
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IUserRepository, UserEntity, UserFilterCriteria } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';
import { QueryBuilder } from '../../query.builder.js';
import { PaginationHelper } from '../../pagination.helper.js';

export class PrismaUserRepository
  extends AbstractRepository<UserEntity, string, UserFilterCriteria>
  implements IUserRepository
{
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    super('User');
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id } });
    return count > 0;
  }

  public async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: { equals: username, mode: 'insensitive' } }
    });
    return count > 0;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    return count > 0;
  }

  public async count(filter?: UserFilterCriteria): Promise<number> {
    const where = QueryBuilder.buildUserWhere(filter);
    return this.prisma.user.count({ where });
  }

  public async findMany(options?: QueryOptions<UserEntity>): Promise<readonly UserEntity[]> {
    const where = QueryBuilder.buildUserWhere(options?.filter as UserFilterCriteria | undefined);
    const { skip, take } = PaginationHelper.normalize(options?.pagination);

    let orderBy: Record<string, 'asc' | 'desc'> | undefined;
    if (options?.sort) {
      const entries = Object.entries(options.sort);
      if (entries.length > 0) {
        const [field, order] = entries[0] as [string, 'asc' | 'desc'];
        orderBy = { [field]: order };
      }
    }

    const records = await this.prisma.user.findMany({
      where,
      skip: options?.pagination ? skip : undefined,
      take: options?.pagination ? take : undefined,
      orderBy
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  public async create(
    entity: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserEntity> {
    const record = await this.prisma.user.create({
      data: {
        username: entity.username,
        email: entity.email,
        passwordHash: entity.passwordHash,
        salt: entity.salt,
        algorithm: entity.algorithm,
        status: entity.status,
        emailVerified: entity.emailVerified,
        twoFactorEnabled: entity.twoFactorEnabled,
        twoFactorSecret: entity.twoFactorSecret,
        failedLoginAttempts: entity.failedLoginAttempts,
        lockoutUntil: entity.lockoutUntil,
        lastLoginAt: entity.lastLoginAt,
        lastPasswordChangeAt: entity.lastPasswordChangeAt
      }
    });

    return this.mapToEntity(record);
  }

  public async update(id: string, patch: Partial<UserEntity>): Promise<UserEntity> {
    const record = await this.prisma.user.update({
      where: { id },
      data: {
        ...(patch.username !== undefined && { username: patch.username }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.passwordHash !== undefined && { passwordHash: patch.passwordHash }),
        ...(patch.salt !== undefined && { salt: patch.salt }),
        ...(patch.algorithm !== undefined && { algorithm: patch.algorithm }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.emailVerified !== undefined && { emailVerified: patch.emailVerified }),
        ...(patch.twoFactorEnabled !== undefined && { twoFactorEnabled: patch.twoFactorEnabled }),
        ...(patch.twoFactorSecret !== undefined && { twoFactorSecret: patch.twoFactorSecret }),
        ...(patch.failedLoginAttempts !== undefined && {
          failedLoginAttempts: patch.failedLoginAttempts
        }),
        ...(patch.lockoutUntil !== undefined && { lockoutUntil: patch.lockoutUntil }),
        ...(patch.lastLoginAt !== undefined && { lastLoginAt: patch.lastLoginAt }),
        ...(patch.lastPasswordChangeAt !== undefined && {
          lastPasswordChangeAt: patch.lastPasswordChangeAt
        })
      }
    });

    return this.mapToEntity(record);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async incrementFailedAttempts(id: string, lockoutUntil?: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
        ...(lockoutUntil && { lockoutUntil })
      }
    });
  }

  public async resetFailedAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    });
  }

  public async updateLastLogin(id: string, timestamp: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: timestamp }
    });
  }

  private mapToEntity(record: any): UserEntity {
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      passwordHash: record.passwordHash,
      salt: record.salt,
      algorithm: record.algorithm,
      status: record.status,
      emailVerified: record.emailVerified,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      failedLoginAttempts: record.failedLoginAttempts,
      lockoutUntil: record.lockoutUntil,
      lastLoginAt: record.lastLoginAt,
      lastPasswordChangeAt: record.lastPasswordChangeAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
