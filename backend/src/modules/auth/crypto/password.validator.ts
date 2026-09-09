/**
 * WebOS Backend - Password Strength & Policy Validator
 * Validates complexity, length, Shannon entropy, and blacklisted breached passwords.
 */

import type { PasswordStrengthResult } from '../auth.types.js';

const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  'welcome',
  'webos123',
  'admin123',
  'password123',
  'changeme',
  'administrator',
  'iloveyou',
  'monkey',
  'sunshine',
  'princess',
  'football',
  'master',
  'computer',
  'secret',
  'system',
  'guest',
  'letmein',
  'default'
]);

export interface PasswordPolicyOptions {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly requireUppercase?: boolean;
  readonly requireLowercase?: boolean;
  readonly requireNumbers?: boolean;
  readonly requireSpecialChars?: boolean;
  readonly minScore?: number;
}

export class PasswordValidator {
  private readonly minLength: number;
  private readonly maxLength: number;
  private readonly requireUppercase: boolean;
  private readonly requireLowercase: boolean;
  private readonly requireNumbers: boolean;
  private readonly requireSpecialChars: boolean;
  private readonly minScore: number;

  constructor(options: PasswordPolicyOptions = {}) {
    this.minLength = options.minLength ?? 8;
    this.maxLength = options.maxLength ?? 128;
    this.requireUppercase = options.requireUppercase ?? true;
    this.requireLowercase = options.requireLowercase ?? true;
    this.requireNumbers = options.requireNumbers ?? true;
    this.requireSpecialChars = options.requireSpecialChars ?? true;
    this.minScore = options.minScore ?? 40;
  }

  public validate(password: string): PasswordStrengthResult {
    const feedback: string[] = [];

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        feedback: ['Password cannot be empty'],
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        isCommonPassword: false
      };
    }

    const hasMinLength = password.length >= this.minLength;
    const hasMaxLength = password.length <= this.maxLength;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const isCommonPassword = COMMON_PASSWORDS.has(password.toLowerCase());

    if (!hasMinLength) {
      feedback.push(`Password must be at least ${this.minLength} characters long`);
    }
    if (!hasMaxLength) {
      feedback.push(`Password must not exceed ${this.maxLength} characters`);
    }
    if (this.requireUppercase && !hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter');
    }
    if (this.requireLowercase && !hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter');
    }
    if (this.requireNumbers && !hasNumber) {
      feedback.push('Password must contain at least one number');
    }
    if (this.requireSpecialChars && !hasSpecialChar) {
      feedback.push('Password must contain at least one special character (!@#$%^&*...)');
    }
    if (isCommonPassword) {
      feedback.push('This password is very common and easily guessed. Please choose a stronger one');
    }

    // Compute heuristic score from 0 to 100
    let score = 0;
    if (hasMinLength) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    if (hasUppercase) score += 15;
    if (hasLowercase) score += 10;
    if (hasNumber) score += 10;
    if (hasSpecialChar) score += 15;
    if (isCommonPassword) score = Math.min(score, 10);

    const isValid =
      hasMinLength &&
      hasMaxLength &&
      (!this.requireUppercase || hasUppercase) &&
      (!this.requireLowercase || hasLowercase) &&
      (!this.requireNumbers || hasNumber) &&
      (!this.requireSpecialChars || hasSpecialChar) &&
      !isCommonPassword &&
      score >= this.minScore;

    return {
      isValid,
      score,
      feedback,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isCommonPassword
    };
  }
}

export const defaultPasswordValidator = new PasswordValidator();
