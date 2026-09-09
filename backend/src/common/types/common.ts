/**
 * WebOS Backend Foundation - Common Types
 * Production-grade functional and utility types
 */

/**
 * Result pattern for safe functional error handling without unhandled exceptions
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T; readonly error?: never }
  | { readonly ok: false; readonly error: E; readonly value?: never };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },

  err<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is { readonly ok: true; readonly value: T } {
    return result.ok;
  },

  isErr<T, E>(result: Result<T, E>): result is { readonly ok: false; readonly error: E } {
    return !result.ok;
  },

  unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  },

  map<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
    if (result.ok) {
      return Result.ok(fn(result.value));
    }
    return result;
  },

  mapErr<T, E, F>(result: Result<T, E>, fn: (err: E) => F): Result<T, F> {
    if (!result.ok) {
      return Result.err(fn(result.error));
    }
    return result;
  },

  async fromPromise<T, E = Error>(
    promise: Promise<T>,
    errorMapper?: (err: unknown) => E
  ): Promise<Result<T, E>> {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (err) {
      const mapped = errorMapper ? errorMapper(err) : (err as E);
      return Result.err(mapped);
    }
  }
} as const;

/**
 * Pagination types for query contracts
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: readonly T[];
  meta: PaginationMetadata;
}

/**
 * Standard utility types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Dictionary<T = unknown> = Record<string, T>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type AsyncVoidFunction = () => Promise<void>;
export type VoidFunction = () => void;
