/**
 * WebOS Backend - In-Memory AuthAttempt Repository
 */

import type { IAuthAttemptRepository, AuthAttemptEntity } from '../../database.types.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryAuthAttemptRepository implements IAuthAttemptRepository {
  private readonly store = new Map<string, AuthAttemptEntity>();

  public async recordAttempt(
    data: Omit<AuthAttemptEntity, 'id' | 'attemptedAt'>
  ): Promise<AuthAttemptEntity> {
    const id = IdUtils.generateUuid();
    const entity: AuthAttemptEntity = {
      ...data,
      id,
      attemptedAt: new Date()
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async countRecentFailures(identifier: string, since: Date): Promise<number> {
    const norm = identifier.toLowerCase();
    let count = 0;
    for (const a of this.store.values()) {
      if (
        !a.success &&
        a.identifier.toLowerCase() === norm &&
        a.attemptedAt >= since
      ) {
        count++;
      }
    }
    return count;
  }

  public async countRecentIpFailures(ipAddress: string, since: Date): Promise<number> {
    let count = 0;
    for (const a of this.store.values()) {
      if (!a.success && a.ipAddress === ipAddress && a.attemptedAt >= since) {
        count++;
      }
    }
    return count;
  }

  public async findRecent(
    options?: QueryOptions<AuthAttemptEntity>
  ): Promise<readonly AuthAttemptEntity[]> {
    let list = Array.from(this.store.values());
    list.sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime());

    if (options?.pagination) {
      const page = Math.max(1, options.pagination.page ?? 1);
      const limit = Math.max(1, Math.min(100, options.pagination.limit ?? 20));
      const offset = options.pagination.offset ?? (page - 1) * limit;
      list = list.slice(offset, offset + limit);
    }

    return list.map((a) => ({ ...a }));
  }

  public async clearOldAttempts(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, a] of this.store.entries()) {
      if (a.attemptedAt < olderThan) {
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
