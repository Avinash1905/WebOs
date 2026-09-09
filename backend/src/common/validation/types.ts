/**
 * WebOS Backend Foundation - Validation Types
 */

import { z } from 'zod';


export interface RequestValidationSchema<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  THeaders extends z.ZodTypeAny = z.ZodTypeAny
> {
  readonly body?: TBody;
  readonly query?: TQuery;
  readonly params?: TParams;
  readonly headers?: THeaders;
}

export type InferValidated<T extends z.ZodTypeAny> = z.infer<T>;
