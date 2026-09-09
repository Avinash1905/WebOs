/**
 * WebOS Backend - In-Memory LoginHistory Repository
 */

import type { ILoginHistoryRepository, LoginHistoryEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryLoginHistoryRepository implements ILoginHistoryRepository {
  private readonly store = new Map<string, LoginHistoryEntity>();

  public async recordLogin(
    data: Omit<LoginHistoryEntity, 'id' | 'loginAt' | 'logoutAt'>
  ): Promise<LoginHistoryEntity> {
    const id = IdUtils.generateUuid();
    const entity: LoginHistoryEntity = {
      ...data,
      id,
      loginAt: new Date(),
      logoutAt: null
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async recordLogout(userId: string, ipAddress: string, logoutAt: Date): Promise<void> {
    for (const h of this.store.values()) {
      if (h.userId === userId && h.ipAddress === ipAddress && !h.logoutAt) {
        h.logoutAt = logoutAt;
        return;
      }
    }
  }

  public async findByUserId(
    userId: string,
    limit = 20
  ): Promise<readonly LoginHistoryEntity[]> {
    const list: LoginHistoryEntity[] = [];
    for (const h of this.store.values()) {
      if (h.userId === userId) {
        list.push({ ...h });
      }
    }
    list.sort((a, b) => b.loginAt.getTime() - a.loginAt.getTime());
    return list.slice(0, limit);
  }

  public clear(): void {
    this.store.clear();
  }
}
