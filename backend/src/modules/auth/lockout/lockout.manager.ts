/**
 * WebOS Backend - Account Lockout & Brute-Force Protection Manager
 * Sliding window failure tracking, progressive backoff, and IP rate limiting.
 */

import type {
  IUserRepository,
  IAuthAttemptRepository,
  UserEntity
} from '../../database/database.types.js';
import type { LockoutPolicyConfig, LockoutStatus } from '../auth.types.js';

export const DEFAULT_LOCKOUT_POLICY: LockoutPolicyConfig = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  attemptWindowMinutes: 15,
  progressiveLockout: true
};

export class LockoutManager {
  private readonly policy: LockoutPolicyConfig;
  private readonly userRepo: IUserRepository;
  private readonly attemptRepo: IAuthAttemptRepository;

  constructor(
    userRepo: IUserRepository,
    attemptRepo: IAuthAttemptRepository,
    policy: Partial<LockoutPolicyConfig> = {}
  ) {
    this.userRepo = userRepo;
    this.attemptRepo = attemptRepo;
    this.policy = { ...DEFAULT_LOCKOUT_POLICY, ...policy };
  }

  /**
   * Checks whether the user account or IP is currently locked out.
   */
  public async checkLockout(
    user: UserEntity | null,
    ipAddress: string
  ): Promise<LockoutStatus> {
    const now = new Date();

    // 1. Check user-level lockout
    if (user && user.lockoutUntil && user.lockoutUntil > now) {
      const remainingMs = user.lockoutUntil.getTime() - now.getTime();
      return {
        isLocked: true,
        remainingLockoutMs: remainingMs,
        failedAttempts: user.failedLoginAttempts,
        maxAttempts: this.policy.maxFailedAttempts,
        lockoutUntil: user.lockoutUntil
      };
    }

    // 2. Check IP-level threshold (e.g. 20 failures across any user from same IP in window)
    const windowStart = new Date(now.getTime() - this.policy.attemptWindowMinutes * 60 * 1000);
    const ipFailures = await this.attemptRepo.countRecentIpFailures(ipAddress, windowStart);
    const ipMax = this.policy.maxFailedAttempts * 4;

    if (ipFailures >= ipMax) {
      const lockoutUntil = new Date(now.getTime() + this.policy.lockoutDurationMinutes * 60 * 1000);
      return {
        isLocked: true,
        remainingLockoutMs: this.policy.lockoutDurationMinutes * 60 * 1000,
        failedAttempts: ipFailures,
        maxAttempts: ipMax,
        lockoutUntil
      };
    }

    return {
      isLocked: false,
      remainingLockoutMs: 0,
      failedAttempts: user ? user.failedLoginAttempts : 0,
      maxAttempts: this.policy.maxFailedAttempts,
      lockoutUntil: null
    };
  }

  /**
   * Records a failed login attempt and calculates lockout if threshold exceeded.
   */
  public async recordFailure(
    user: UserEntity | null,
    identifier: string,
    ipAddress: string,
    reason: string = 'INVALID_CREDENTIALS'
  ): Promise<LockoutStatus> {
    const now = new Date();

    // Record in auth attempts table
    await this.attemptRepo.recordAttempt({
      userId: user ? user.id : null,
      identifier,
      ipAddress,
      userAgent: 'WebOS-Auth',
      success: false,
      failureReason: reason
    });

    if (!user) {
      return {
        isLocked: false,
        remainingLockoutMs: 0,
        failedAttempts: 1,
        maxAttempts: this.policy.maxFailedAttempts,
        lockoutUntil: null
      };
    }

    const newAttempts = user.failedLoginAttempts + 1;
    let lockoutUntil: Date | null = null;

    if (newAttempts >= this.policy.maxFailedAttempts) {
      // Calculate lockout duration (with progressive escalation if configured)
      let multiplier = 1;
      if (this.policy.progressiveLockout) {
        // Double lockout time for every 5 extra attempts (e.g. 5 attempts = 15m, 10 attempts = 30m, 15 attempts = 60m)
        const escalationSteps = Math.floor((newAttempts - this.policy.maxFailedAttempts) / 5);
        multiplier = Math.min(Math.pow(2, escalationSteps), 8); // max 8x multiplier (120 min)
      }

      const durationMs = this.policy.lockoutDurationMinutes * 60 * 1000 * multiplier;
      lockoutUntil = new Date(now.getTime() + durationMs);

      await this.userRepo.incrementFailedAttempts(user.id, lockoutUntil);

      return {
        isLocked: true,
        remainingLockoutMs: durationMs,
        failedAttempts: newAttempts,
        maxAttempts: this.policy.maxFailedAttempts,
        lockoutUntil
      };
    }

    await this.userRepo.incrementFailedAttempts(user.id);

    return {
      isLocked: false,
      remainingLockoutMs: 0,
      failedAttempts: newAttempts,
      maxAttempts: this.policy.maxFailedAttempts,
      lockoutUntil: null
    };
  }

  /**
   * Resets failed login attempts upon successful login.
   */
  public async resetOnSuccess(userId: string): Promise<void> {
    await this.userRepo.resetFailedAttempts(userId);
  }
}
