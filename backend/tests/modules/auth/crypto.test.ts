/**
 * WebOS Backend - Cryptographic Security Tests
 * Unit tests for PasswordHasher, PasswordValidator, and TokenGenerator.
 */

import { describe, it, expect } from 'vitest';
import { PasswordHasher } from '../../../src/modules/auth/crypto/password.hasher.js';
import { PasswordValidator } from '../../../src/modules/auth/crypto/password.validator.js';
import { TokenGenerator } from '../../../src/modules/auth/crypto/token.generator.js';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher({ pepper: 'webos-super-secret-test-pepper' });

  it('should hash a password and verify it successfully with scrypt', async () => {
    const password = 'SuperSecurePassword123!@#';
    const result = await hasher.hashPassword(password);

    expect(result.hash).toBeDefined();
    expect(result.salt).toBeDefined();
    expect(result.algorithm).toBe('scrypt');
    expect(result.hash.length).toBe(128); // 64 bytes hex
    expect(result.salt.length).toBe(64); // 32 bytes hex

    const isValid = await hasher.verifyPassword(
      password,
      result.hash,
      result.salt,
      result.algorithm
    );
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const password = 'SuperSecurePassword123!@#';
    const result = await hasher.hashPassword(password);

    const isWrongValid = await hasher.verifyPassword(
      'WrongPassword456!@#',
      result.hash,
      result.salt,
      result.algorithm
    );
    expect(isWrongValid).toBe(false);
  });

  it('should generate different salts and hashes for identical passwords', async () => {
    const password = 'SamePasswordEverytime1!';
    const hash1 = await hasher.hashPassword(password);
    const hash2 = await hasher.hashPassword(password);

    expect(hash1.salt).not.toBe(hash2.salt);
    expect(hash1.hash).not.toBe(hash2.hash);

    expect(await hasher.verifyPassword(password, hash1.hash, hash1.salt)).toBe(true);
    expect(await hasher.verifyPassword(password, hash2.hash, hash2.salt)).toBe(true);
  });

  it('should handle PBKDF2 algorithm verification as well', async () => {
    const password = 'Pbkdf2FallbackPassword99$';
    const salt = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';
    // Test PBKDF2 flow
    const isInvalid = await hasher.verifyPassword(
      password,
      '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      salt,
      'pbkdf2'
    );
    expect(isInvalid).toBe(false);
  });

  it('should reject empty or malformed input safely without crashing', async () => {
    expect(await hasher.verifyPassword('', '', '')).toBe(false);
    expect(await hasher.verifyPassword('test', 'bad-hash', 'salt')).toBe(false);
  });
});

describe('PasswordValidator', () => {
  const validator = new PasswordValidator();

  it('should accept strong compliant passwords', () => {
    const result = validator.validate('Correct-Horse-Battery-Staple-2026!');
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.feedback.length).toBe(0);
    expect(result.hasMinLength).toBe(true);
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isCommonPassword).toBe(false);
  });

  it('should reject passwords that are too short', () => {
    const result = validator.validate('Ab1!');
    expect(result.isValid).toBe(false);
    expect(result.hasMinLength).toBe(false);
    expect(result.feedback.some((f) => f.includes('at least 8 characters'))).toBe(true);
  });

  it('should reject passwords missing uppercase letters', () => {
    const result = validator.validate('nouppercase123!');
    expect(result.isValid).toBe(false);
    expect(result.hasUppercase).toBe(false);
  });

  it('should reject passwords missing numbers', () => {
    const result = validator.validate('NoNumbersInHere!');
    expect(result.isValid).toBe(false);
    expect(result.hasNumber).toBe(false);
  });

  it('should reject passwords missing special characters', () => {
    const result = validator.validate('NoSpecialChars123');
    expect(result.isValid).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
  });

  it('should reject common breached passwords from blacklist', () => {
    const result = validator.validate('password123');
    expect(result.isValid).toBe(false);
    expect(result.isCommonPassword).toBe(true);
  });
});

describe('TokenGenerator', () => {
  it('should generate 256-bit cryptographically random session tokens', () => {
    const token1 = TokenGenerator.generateSessionToken();
    const token2 = TokenGenerator.generateSessionToken();

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url is 43 chars
  });

  it('should hash tokens deterministically with SHA-256', () => {
    const token = 'my-secret-session-token';
    const hash1 = TokenGenerator.hashToken(token);
    const hash2 = TokenGenerator.hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // 256 bits = 64 hex characters
  });

  it('should generate URL-safe tokens with customizable length', () => {
    const token = TokenGenerator.generateUrlSafeToken(16);
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThanOrEqual(20);
  });

  it('should perform constant-time equality check safely', () => {
    const hashA = TokenGenerator.hashToken('token-a');
    const hashB = TokenGenerator.hashToken('token-b');

    expect(TokenGenerator.timingSafeEqual(hashA, hashA)).toBe(true);
    expect(TokenGenerator.timingSafeEqual(hashA, hashB)).toBe(false);
    expect(TokenGenerator.timingSafeEqual('short', 'much-longer-string')).toBe(false);
  });
});
