/**
 * WebOS Backend Foundation - Standardized Error Codes
 */

export const ErrorCode = {
  // Client Errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT'
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const DefaultErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.VALIDATION_ERROR]: 'Request validation failed',
  [ErrorCode.UNAUTHORIZED]: 'Authentication is required to access this resource',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.ROUTE_NOT_FOUND]: 'Route not found',
  [ErrorCode.METHOD_NOT_ALLOWED]: 'HTTP method not allowed for this route',
  [ErrorCode.CONFLICT]: 'A conflict occurred with the current state of the resource',
  [ErrorCode.PAYLOAD_TOO_LARGE]: 'Request payload exceeds maximum allowed size',
  [ErrorCode.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported media type',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
  [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred',
  [ErrorCode.NOT_IMPLEMENTED]: 'This feature is not implemented',
  [ErrorCode.BAD_GATEWAY]: 'Bad gateway',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  [ErrorCode.GATEWAY_TIMEOUT]: 'Gateway timeout'
};
