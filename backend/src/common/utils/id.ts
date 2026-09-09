/**
 * WebOS Backend Foundation - Identifier Utilities
 */

import { randomUUID, randomBytes } from 'node:crypto';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NANOID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const IdUtils = {
  /**
   * Generate a secure cryptographically random RFC 4122 UUID v4
   */
  generateUuid(): string {
    return randomUUID();
  },

  /**
   * Validate if a string is a valid UUID v4
   */
  isValidUuid(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    return UUID_V4_REGEX.test(id);
  },

  /**
   * Generate a compact random alphanumeric ID (default 21 characters)
   */
  generateCompactId(size = 21): string {
    const bytes = randomBytes(size);
    let id = '';
    const alphabetLen = NANOID_ALPHABET.length;
    for (let i = 0; i < size; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        id += NANOID_ALPHABET[byte % alphabetLen];
      }
    }
    return id;
  },

  /**
   * Generate a prefixed identifier (e.g. req_abc123)
   */
  generatePrefixedId(prefix: string, size = 16): string {
    return `${prefix}_${IdUtils.generateCompactId(size)}`;
  }
} as const;
