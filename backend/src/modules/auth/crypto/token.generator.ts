/**
 * WebOS Backend - Cryptographic Token Generator
 * High-entropy random token generation & SHA-256 token hashing for database storage.
 */

import crypto from 'node:crypto';

export class TokenGenerator {
  /**
   * Generates a 256-bit (32 bytes) cryptographically secure random session token
   */
  public static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generates a URL-safe random token (useful for password resets, email verification)
   */
  public static generateUrlSafeToken(byteLength: number = 32): string {
    return crypto.randomBytes(byteLength).toString('base64url');
  }

  /**
   * Generates an alphanumeric code (e.g. 6-digit confirmation code)
   */
  public static generateDigits(length: number = 6): string {
    const digits = '0123456789';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      const b = bytes[i] ?? 0;
      result += digits[b % digits.length];
    }
    return result;
  }

  /**
   * Hashes a raw token with SHA-256 for secure database storage.
   * Prevents raw tokens from being compromised in database dumps.
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }

  /**
   * Constant-time comparison between two token hashes
   */
  public static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  }
}
