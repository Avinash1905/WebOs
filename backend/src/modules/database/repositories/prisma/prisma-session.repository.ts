/**
 * WebOS Backend - Prisma Session Repository
 */

import type { ISessionRepository, SessionEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaSessionRepository implements ISessionRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<SessionEntity | null> {
    const record = await this.prisma.session.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    const record = await this.prisma.session.findUnique({ where: { tokenHash } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByUserId(userId: string, activeOnly = false): Promise<readonly SessionEntity[]> {
    const where: Record<string, unknown> = { userId };
    if (activeOnly) {
      where.status = 'ACTIVE';
      where.expiresAt = { gt: new Date() };
    }

    const records = await this.prisma.session.findMany({
      where,
      orderBy: { lastActiveAt: 'desc' }
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  public async create(
    entity: Omit<SessionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SessionEntity> {
    const record = await this.prisma.session.create({
      data: {
        userId: entity.userId,
        tokenHash: entity.tokenHash,
        status: entity.status,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        lastActiveAt: entity.lastActiveAt,
        expiresAt: entity.expiresAt,
        revokedAt: entity.revokedAt,
        revocationReason: entity.revocationReason
      }
    });
    return this.mapToEntity(record);
  }

  public async update(id: string, patch: Partial<SessionEntity>): Promise<SessionEntity> {
    const record = await this.prisma.session.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.lastActiveAt !== undefined && { lastActiveAt: patch.lastActiveAt }),
        ...(patch.expiresAt !== undefined && { expiresAt: patch.expiresAt }),
        ...(patch.revokedAt !== undefined && { revokedAt: patch.revokedAt }),
        ...(patch.revocationReason !== undefined && { revocationReason: patch.revocationReason })
      }
    });
    return this.mapToEntity(record);
  }

  public async updateLastActive(id: string, timestamp: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { lastActiveAt: timestamp }
    });
  }

  public async revokeSession(id: string, reason?: string): Promise<boolean> {
    try {
      await this.prisma.session.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason ?? 'Revoked by user'
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  public async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
    reason?: string
  ): Promise<number> {
    const where: Record<string, unknown> = {
      userId,
      status: 'ACTIVE'
    };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const result = await this.prisma.session.updateMany({
      where,
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revocationReason: reason ?? 'Mass revocation'
      }
    });

    return result.count;
  }

  public async deleteExpiredSessions(olderThan: Date): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: olderThan } },
          { status: 'REVOKED', updatedAt: { lte: olderThan } }
        ]
      }
    });
    return result.count;
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });
  }

  private mapToEntity(record: any): SessionEntity {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      status: record.status,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      lastActiveAt: record.lastActiveAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      revocationReason: record.revocationReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
