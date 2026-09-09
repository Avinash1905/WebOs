/**
 * WebOS Backend - Prisma PasswordResetToken Repository
 */

import type {
  IPasswordResetTokenRepository,
  PasswordResetTokenEntity
} from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetTokenEntity> {
    const record = await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return this.mapToEntity(record);
  }

  public async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });
    return record ? this.mapToEntity(record) : null;
  }

  public async markAsUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  public async invalidateAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() }
    });
    return result.count;
  }

  public async deleteExpired(olderThan: Date): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: olderThan } },
          { usedAt: { lte: olderThan } }
        ]
      }
    });
    return result.count;
  }

  private mapToEntity(record: any): PasswordResetTokenEntity {
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
