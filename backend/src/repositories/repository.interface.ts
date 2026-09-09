/**
 * WebOS Backend Foundation - Generic Repository Interface Contract
 * Future data modules (PostgreSQL, Prisma, FileSystem) implement this interface.
 */

import type { PaginatedResult, QueryOptions } from './query.types.js';

export interface IRepository<TEntity, TId = string, TFilter = unknown> {
  findById(id: TId): Promise<TEntity | null>;
  findMany(options?: QueryOptions<TEntity>): Promise<readonly TEntity[]>;
  findPaginated(options?: QueryOptions<TEntity>): Promise<PaginatedResult<TEntity>>;
  count(filter?: TFilter): Promise<number>;
  exists(id: TId): Promise<boolean>;
  create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;
  update(id: TId, patch: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<boolean>;
}
