/**
 * WebOS Backend Foundation - Repository Query and Filter Types
 */

export type SortDirection = 'asc' | 'desc';

export type SortCriteria<T> = {
  readonly [P in keyof T]?: SortDirection;
};

export type FilterCondition<V> =
  | V
  | { readonly eq?: V }
  | { readonly neq?: V }
  | { readonly in?: readonly V[] }
  | { readonly notIn?: readonly V[] }
  | { readonly contains?: string }
  | { readonly startsWith?: string }
  | { readonly gt?: V }
  | { readonly gte?: V }
  | { readonly lt?: V }
  | { readonly lte?: V };

export type FilterCriteria<T> = {
  readonly [P in keyof T]?: FilterCondition<T[P]>;
};

export interface PaginationCriteria {
  readonly page?: number;
  readonly limit?: number;
  readonly offset?: number;
}

export interface QueryOptions<T> {
  readonly filter?: FilterCriteria<T>;
  readonly sort?: SortCriteria<T>;
  readonly pagination?: PaginationCriteria;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}
