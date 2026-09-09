/**
 * WebOS Backend Foundation - Request Context Types
 */

import type { HttpMethod } from './http.types.js';

export interface ClientMetadata {
  readonly ip: string;
  readonly userAgent: string;
  readonly host: string;
  readonly protocol: string;
}

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly startTimeMonotonicNs: bigint;
  readonly method: HttpMethod;
  readonly url: string;
  readonly routePath: string;
  readonly client: ClientMetadata;
  /**
   * Future extension slots for auth, sessions, workspace, user
   */
  readonly userId?: string;
  readonly sessionId?: string;
  readonly workspaceId?: string;
  readonly roles?: readonly string[];
}
