/**
 * WebOS Backend Foundation - HTTP Constants and Types
 */

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,

  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const HttpHeader = {
  CONTENT_TYPE: 'content-type',
  CONTENT_LENGTH: 'content-length',
  AUTHORIZATION: 'authorization',
  X_REQUEST_ID: 'x-request-id',
  X_CORRELATION_ID: 'x-correlation-id',
  X_RESPONSE_TIME: 'x-response-time',
  SERVER_TIMING: 'server-timing',
  USER_AGENT: 'user-agent',
  CACHE_CONTROL: 'cache-control'
} as const;

export type HttpHeaderName = (typeof HttpHeader)[keyof typeof HttpHeader];

export const ContentType = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  OCTET_STREAM: 'application/octet-stream'
} as const;
