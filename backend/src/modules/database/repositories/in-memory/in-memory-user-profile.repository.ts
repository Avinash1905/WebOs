/**
 * WebOS Backend - In-Memory UserProfile Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IUserProfileRepository, UserProfileEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryUserProfileRepository
  extends AbstractRepository<UserProfileEntity, string, unknown>
  implements IUserProfileRepository
{
  private readonly store = new Map<string, UserProfileEntity>();

  constructor(initialProfiles: readonly UserProfileEntity[] = []) {
    super('UserProfile');
    for (const p of initialProfiles) {
      this.store.set(p.id, { ...p });
    }
  }

  public async findById(id: string): Promise<UserProfileEntity | null> {
    const profile = this.store.get(id);
    return profile ? { ...profile } : null;
  }

  public async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    for (const profile of this.store.values()) {
      if (profile.userId === userId) {
        return { ...profile };
      }
    }
    return null;
  }

  public async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  public async count(): Promise<number> {
    return this.store.size;
  }

  public async findMany(options?: QueryOptions<UserProfileEntity>): Promise<readonly UserProfileEntity[]> {
    let items = Array.from(this.store.values());
    if (options?.pagination) {
      const page = Math.max(1, options.pagination.page ?? 1);
      const limit = Math.max(1, Math.min(100, options.pagination.limit ?? 20));
      const offset = options.pagination.offset ?? (page - 1) * limit;
      items = items.slice(offset, offset + limit);
    }
    return items.map((p) => ({ ...p }));
  }

  public async create(
    data: Omit<UserProfileEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserProfileEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: UserProfileEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<UserProfileEntity>): Promise<UserProfileEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Profile with ID ${id} not found`);
    }
    const updated: UserProfileEntity = {
      ...existing,
      ...patch,
      id: existing.id,
      userId: existing.userId,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  public async updateByUserId(
    userId: string,
    patch: Partial<UserProfileEntity>
  ): Promise<UserProfileEntity> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile for user ${userId} not found`);
    }
    return this.update(existing.id, patch);
  }

  public async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  public async deleteByUserId(userId: string): Promise<boolean> {
    const existing = await this.findByUserId(userId);
    if (!existing) return false;
    return this.delete(existing.id);
  }

  public clear(): void {
    this.store.clear();
  }
}
