/**
 * WebOS Backend - Prisma EmailVerificationToken Repository
 */

import type {
  IEmailVerificationTokenRepository,
  EmailVerificationTokenEntity
} from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<EmailVerificationTokenEntity> {
    const record = await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return this.mapToEntity(record);
  }

  public async findByTokenHash(tokenHash: string): Promise<EmailVerificationTokenEntity | null> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async markAsUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  public async invalidateAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() }
    });
    return result.count;
  }

  public async deleteExpired(olderThan: Date): Promise<number> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: olderThan } },
          { usedAt: { lte: olderThan } }
        ]
      }
    });
    return result.count;
  }

  private mapToEntity(record: any): EmailVerificationTokenEntity {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt
    };
  }
}
