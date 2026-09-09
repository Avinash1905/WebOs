/**
 * WebOS Backend - Prisma LoginHistory Repository
 */

import type { ILoginHistoryRepository, LoginHistoryEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaLoginHistoryRepository implements ILoginHistoryRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async recordLogin(
    data: Omit<LoginHistoryEntity, 'id' | 'loginAt' | 'logoutAt'>
  ): Promise<LoginHistoryEntity> {
    const record = await this.prisma.loginHistory.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location ?? null,
        deviceSummary: data.deviceSummary ?? null
      }
    });
    return this.mapToEntity(record);
  }

  public async recordLogout(userId: string, ipAddress: string, logoutAt: Date): Promise<void> {
    const latest = await this.prisma.loginHistory.findFirst({
      where: { userId, ipAddress, logoutAt: null },
      orderBy: { loginAt: 'desc' }
    });

    if (latest) {
      await this.prisma.loginHistory.update({
        where: { id: latest.id },
        data: { logoutAt }
      });
    }
  }

  public async findByUserId(
    userId: string,
    limit = 20
  ): Promise<readonly LoginHistoryEntity[]> {
    const records = await this.prisma.loginHistory.findMany({
      where: { userId },
      take: limit,
      orderBy: { loginAt: 'desc' }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  private mapToEntity(record: any): LoginHistoryEntity {
    return {
      id: record.id,
      userId: record.userId,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      location: record.location,
      deviceSummary: record.deviceSummary,
      loginAt: record.loginAt,
      logoutAt: record.logoutAt
    };
  }
}
