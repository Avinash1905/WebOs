/**
 * WebOS Backend Foundation - Log Redaction
 * Safeguards against logging sensitive user or system data.
 */

export const DEFAULT_REDACT_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-auth-token"]',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'headers.authorization',
  'headers.cookie',
  'password',
  'passwordConfirm',
  'newPassword',
  'currentPassword',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'privateKey',
  'sessionId'
];

const SENSITIVE_KEY_REGEX = /^(password|token|secret|authorization|cookie|apikey|access_token|refresh_token)/i;

/**
 * Filter sensitive keys from arbitrary log objects
 */
export function sanitizeLogObject<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
