/**
 * WebOS Backend - Pagination Helpers
 */

import type { PaginatedResult, PaginationCriteria } from '../../repositories/query.types.js';

export class PaginationHelper {
  public static normalize(criteria?: PaginationCriteria): {
    page: number;
    limit: number;
    skip: number;
    take: number;
  } {
    const page = Math.max(1, criteria?.page ?? 1);
    const limit = Math.max(1, Math.min(100, criteria?.limit ?? 20));
    const skip = criteria?.offset ?? (page - 1) * limit;
    const take = limit;

    return { page, limit, skip, take };
  }

  public static toPaginatedResult<T>(
    items: readonly T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResult<T> {
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
