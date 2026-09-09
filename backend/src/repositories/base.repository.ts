/**
 * WebOS Backend Foundation - Abstract Base Repository
 * Foundation contract for future concrete persistence adapters (e.g. Prisma / Postgres).
 */

import type { IRepository } from './repository.interface.js';
import type { PaginatedResult, PaginationCriteria, QueryOptions } from './query.types.js';

export abstract class AbstractRepository<TEntity, TId = string, TFilter = unknown>
  implements IRepository<TEntity, TId, TFilter>
{
  protected readonly entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  public abstract findById(id: TId): Promise<TEntity | null>;
  public abstract findMany(options?: QueryOptions<TEntity>): Promise<readonly TEntity[]>;
  public abstract count(filter?: TFilter): Promise<number>;
  public abstract exists(id: TId): Promise<boolean>;
  public abstract create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;
  public abstract update(id: TId, patch: Partial<TEntity>): Promise<TEntity>;
  public abstract delete(id: TId): Promise<boolean>;

  /**
   * Reusable pagination computation helper
   */
  public async findPaginated(options?: QueryOptions<TEntity>): Promise<PaginatedResult<TEntity>> {
    const pagination: PaginationCriteria = options?.pagination ?? {};
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.max(1, Math.min(100, pagination.limit ?? 20));
    const offset = pagination.offset ?? (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.findMany({
        ...options,
        pagination: { page, limit, offset }
      }),
      this.count(options?.filter as TFilter | undefined)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
}
