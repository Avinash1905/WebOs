/**
 * WebOS Backend - In-Memory Session Repository
 */

import type { ISessionRepository, SessionEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemorySessionRepository implements ISessionRepository {
  private readonly store = new Map<string, SessionEntity>();

  public async findById(id: string): Promise<SessionEntity | null> {
    const s = this.store.get(id);
    return s ? { ...s } : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    for (const session of this.store.values()) {
      if (session.tokenHash === tokenHash) {
        return { ...session };
      }
    }
    return null;
  }

  public async findByUserId(userId: string, activeOnly = false): Promise<readonly SessionEntity[]> {
    const results: SessionEntity[] = [];
    const now = new Date();
    for (const s of this.store.values()) {
      if (s.userId === userId) {
        if (activeOnly) {
          if (s.status === 'ACTIVE' && s.expiresAt > now) {
            results.push({ ...s });
          }
        } else {
          results.push({ ...s });
        }
      }
    }
    return results;
  }

  public async create(
    data: Omit<SessionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SessionEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: SessionEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<SessionEntity>): Promise<SessionEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Session with ID ${id} not found`);
    }
    const updated: SessionEntity = {
      ...existing,
      ...patch,
      id: existing.id,
      userId: existing.userId,
      tokenHash: existing.tokenHash,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  public async updateLastActive(id: string, timestamp: Date): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    existing.lastActiveAt = timestamp;
    existing.updatedAt = new Date();
  }

  public async revokeSession(id: string, reason?: string): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;
    existing.status = 'REVOKED';
    existing.revokedAt = new Date();
    existing.revocationReason = reason ?? 'Revoked by user';
    existing.updatedAt = new Date();
    return true;
  }

  public async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
    reason?: string
  ): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const s of this.store.values()) {
      if (s.userId === userId && s.id !== exceptSessionId && s.status === 'ACTIVE') {
        s.status = 'REVOKED';
        s.revokedAt = now;
        s.revocationReason = reason ?? 'Mass revocation';
        s.updatedAt = now;
        count++;
      }
    }
    return count;
  }

  public async deleteExpiredSessions(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, s] of Array.from(this.store.entries())) {
      if (s.expiresAt <= olderThan || (s.status === 'REVOKED' && s.updatedAt <= olderThan)) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    const active = await this.findByUserId(userId, true);
    return active.length;
  }

  public clear(): void {
    this.store.clear();
  }
}
