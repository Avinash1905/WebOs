/**
 * WebOS Backend - Prisma AuthAttempt Repository
 */

import type { IAuthAttemptRepository, AuthAttemptEntity } from '../../database.types.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaAuthAttemptRepository implements IAuthAttemptRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async recordAttempt(
    data: Omit<AuthAttemptEntity, 'id' | 'attemptedAt'>
  ): Promise<AuthAttemptEntity> {
    const record = await this.prisma.authenticationAttempt.create({
      data: {
        userId: data.userId ?? null,
        identifier: data.identifier,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        failureReason: data.failureReason ?? null
      }
    });
    return this.mapToEntity(record);
  }

  public async countRecentFailures(identifier: string, since: Date): Promise<number> {
    return this.prisma.authenticationAttempt.count({
      where: {
        identifier: { equals: identifier, mode: 'insensitive' },
        success: false,
        attemptedAt: { gte: since }
      }
    });
  }

  public async countRecentIpFailures(ipAddress: string, since: Date): Promise<number> {
    return this.prisma.authenticationAttempt.count({
      where: {
        ipAddress,
        success: false,
        attemptedAt: { gte: since }
      }
    });
  }

  public async findRecent(
    options?: QueryOptions<AuthAttemptEntity>
  ): Promise<readonly AuthAttemptEntity[]> {
    const records = await this.prisma.authenticationAttempt.findMany({
      skip: options?.pagination?.offset,
      take: options?.pagination?.limit,
      orderBy: { attemptedAt: 'desc' }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async clearOldAttempts(olderThan: Date): Promise<number> {
    const result = await this.prisma.authenticationAttempt.deleteMany({
      where: { attemptedAt: { lt: olderThan } }
    });
    return result.count;
  }

  private mapToEntity(record: any): AuthAttemptEntity {
    return {
      id: record.id,
      userId: record.userId,
      identifier: record.identifier,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      success: record.success,
      failureReason: record.failureReason,
      attemptedAt: record.attemptedAt
    };
  }
}
