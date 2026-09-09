/**
 * WebOS Backend - In-Memory User Repository
 * High-performance, concurrent-safe in-memory adapter for testing and isolated execution.
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IUserRepository, UserEntity, UserFilterCriteria } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryUserRepository
  extends AbstractRepository<UserEntity, string, UserFilterCriteria>
  implements IUserRepository
{
  private readonly store = new Map<string, UserEntity>();

  constructor(initialUsers: readonly UserEntity[] = []) {
    super('User');
    for (const user of initialUsers) {
      this.store.set(user.id, { ...user });
    }
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const user = this.store.get(id);
    return user ? { ...user } : null;
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    const normalized = username.toLowerCase();
    for (const user of this.store.values()) {
      if (user.username.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase();
    for (const user of this.store.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const normalized = identifier.toLowerCase();
    for (const user of this.store.values()) {
      if (user.username.toLowerCase() === normalized || user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  public async existsByUsername(username: string): Promise<boolean> {
    return (await this.findByUsername(username)) !== null;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  public async count(filter?: UserFilterCriteria): Promise<number> {
    const matches = await this.applyFilter(filter);
    return matches.length;
  }

  public async findMany(options?: QueryOptions<UserEntity>): Promise<readonly UserEntity[]> {
    let results = await this.applyFilter(options?.filter as UserFilterCriteria | undefined);

    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      if (sortEntries.length > 0) {
        const [field, order] = sortEntries[0] as [keyof UserEntity, 'asc' | 'desc'];
        results.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          const comp = valA < valB ? -1 : 1;
          return order === 'desc' ? -comp : comp;
        });
      }
    }

    if (options?.pagination) {
      const page = Math.max(1, options.pagination.page ?? 1);
      const limit = Math.max(1, Math.min(100, options.pagination.limit ?? 20));
      const offset = options.pagination.offset ?? (page - 1) * limit;
      results = results.slice(offset, offset + limit);
    }

    return results.map((u) => ({ ...u }));
  }

  public async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: UserEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<UserEntity>): Promise<UserEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`User with ID ${id} not found`);
    }
    const updated: UserEntity = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  public async incrementFailedAttempts(id: string, lockoutUntil?: Date): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    const updated: UserEntity = {
      ...existing,
      failedLoginAttempts: existing.failedLoginAttempts + 1,
      lockoutUntil: lockoutUntil ?? existing.lockoutUntil,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
  }

  public async resetFailedAttempts(id: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    const updated: UserEntity = {
      ...existing,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
  }

  public async updateLastLogin(id: string, timestamp: Date): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    const updated: UserEntity = {
      ...existing,
      lastLoginAt: timestamp,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
  }

  public clear(): void {
    this.store.clear();
  }

  private async applyFilter(filter?: UserFilterCriteria): Promise<UserEntity[]> {
    let items = Array.from(this.store.values());

    if (!filter) {
      return items;
    }

    if (filter.status) {
      items = items.filter((u) => u.status === filter.status);
    }
    if (filter.emailVerified !== undefined) {
      items = items.filter((u) => u.emailVerified === filter.emailVerified);
    }
    if (filter.username) {
      const q = filter.username.toLowerCase();
      items = items.filter((u) => u.username.toLowerCase().includes(q));
    }
    if (filter.email) {
      const q = filter.email.toLowerCase();
      items = items.filter((u) => u.email.toLowerCase().includes(q));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (filter.createdAfter) {
      items = items.filter((u) => u.createdAt >= filter.createdAfter!);
    }
    if (filter.createdBefore) {
      items = items.filter((u) => u.createdAt <= filter.createdBefore!);
    }

    return items;
  }
}
