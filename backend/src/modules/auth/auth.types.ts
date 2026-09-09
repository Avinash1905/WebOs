/**
 * WebOS Backend - Module 3: Authentication Types and DTOs
 */

export interface UserSummaryDto {
  id: string;
  username: string;
  email: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  profile?: {
    displayName: string;
    avatarUrl: string | null;
    locale: string;
    theme: string;
  } | null;
  roles: readonly string[];
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  identifier: string; // username or email
  password: string;
}

export interface AuthSuccessResult {
  user: UserSummaryDto;
  sessionToken: string;
  sessionId: string;
  expiresAt: Date;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface LockoutPolicyConfig {
  readonly maxFailedAttempts: number;
  readonly lockoutDurationMinutes: number;
  readonly attemptWindowMinutes: number;
  readonly progressiveLockout: boolean;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingLockoutMs: number;
  failedAttempts: number;
  maxAttempts: number;
  lockoutUntil: Date | null;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 100
  feedback: readonly string[];
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isCommonPassword: boolean;
}

export interface AuthSecurityContext {
  ipAddress: string;
  userAgent: string;
}
