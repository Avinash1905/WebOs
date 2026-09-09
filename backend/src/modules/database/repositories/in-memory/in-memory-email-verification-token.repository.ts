/**
 * WebOS Backend - In-Memory EmailVerificationToken Repository
 */

import type {
  IEmailVerificationTokenRepository,
  EmailVerificationTokenEntity
} from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryEmailVerificationTokenRepository
  implements IEmailVerificationTokenRepository
{
  private readonly store = new Map<string, EmailVerificationTokenEntity>();

  public async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<EmailVerificationTokenEntity> {
    const id = IdUtils.generateUuid();
    const entity: EmailVerificationTokenEntity = {
      id,
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date()
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async findByTokenHash(
    tokenHash: string
  ): Promise<EmailVerificationTokenEntity | null> {
    for (const t of this.store.values()) {
      if (t.tokenHash === tokenHash) {
        return { ...t };
      }
    }
    return null;
  }

  public async markAsUsed(id: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    existing.usedAt = new Date();
  }

  public async invalidateAllUserTokens(userId: string): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const t of this.store.values()) {
      if (t.userId === userId && !t.usedAt) {
        t.usedAt = now;
        count++;
      }
    }
    return count;
  }

  public async deleteExpired(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, t] of this.store.entries()) {
      if (t.expiresAt <= olderThan || (t.usedAt && t.usedAt <= olderThan)) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
  }
}
