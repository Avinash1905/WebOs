/**
 * @file UserQuotaManager.ts
 * @description POSIX disk block and inode quota governance per user/group.
 */

export interface UserDiskQuota {
  readonly userId: string;
  readonly blockSoftLimit: number; // bytes
  readonly blockHardLimit: number; // bytes
  readonly inodeSoftLimit: number; // file count
  readonly inodeHardLimit: number; // file count
  readonly gracePeriodMs: number;
  usedBytes: number;
  usedInodes: number;
  graceExpiresAt?: number;
}

export class UserQuotaManager {
  private readonly _quotas = new Map<string, UserDiskQuota>();

  public setQuota(
    userId: string,
    limits: {
      blockSoftLimit: number;
      blockHardLimit: number;
      inodeSoftLimit: number;
      inodeHardLimit: number;
      gracePeriodMs?: number;
    }
  ): UserDiskQuota {
    const quota: UserDiskQuota = {
      userId,
      blockSoftLimit: limits.blockSoftLimit,
      blockHardLimit: limits.blockHardLimit,
      inodeSoftLimit: limits.inodeSoftLimit,
      inodeHardLimit: limits.inodeHardLimit,
      gracePeriodMs: limits.gracePeriodMs ?? 7 * 24 * 60 * 60 * 1000, // 7 days default
      usedBytes: 0,
      usedInodes: 0,
    };
    this._quotas.set(userId, quota);
    return quota;
  }

  /**
   * Checks if user has allowance to allocate specified bytes and inodes.
   */
  public checkAllowance(userId: string, deltaBytes: number, deltaInodes: number = 1): { allowed: boolean; reason?: string } {
    const quota = this._quotas.get(userId);
    if (!quota) return { allowed: true }; // No quota set

    const projectedBytes = quota.usedBytes + deltaBytes;
    const projectedInodes = quota.usedInodes + deltaInodes;

    // Hard limit checks
    if (projectedBytes > quota.blockHardLimit) {
      return { allowed: false, reason: `Exceeded hard disk block quota: ${projectedBytes} > ${quota.blockHardLimit}` };
    }
    if (projectedInodes > quota.inodeHardLimit) {
      return { allowed: false, reason: `Exceeded hard inode quota: ${projectedInodes} > ${quota.inodeHardLimit}` };
    }

    // Grace period check for soft limit
    const now = Date.now();
    if (projectedBytes > quota.blockSoftLimit) {
      if (quota.graceExpiresAt && now > quota.graceExpiresAt) {
        return { allowed: false, reason: 'Disk quota soft limit grace period expired' };
      }
    }

    return { allowed: true };
  }

  /**
   * Tracks allocation of bytes/inodes.
   */
  public allocate(userId: string, bytes: number, inodes: number = 1): void {
    const quota = this._quotas.get(userId);
    if (!quota) return;

    quota.usedBytes += bytes;
    quota.usedInodes += inodes;

    if (quota.usedBytes > quota.blockSoftLimit && !quota.graceExpiresAt) {
      quota.graceExpiresAt = Date.now() + quota.gracePeriodMs;
    } else if (quota.usedBytes <= quota.blockSoftLimit) {
      quota.graceExpiresAt = undefined;
    }
  }

  /**
   * Releases allocated bytes/inodes.
   */
  public release(userId: string, bytes: number, inodes: number = 1): void {
    const quota = this._quotas.get(userId);
    if (!quota) return;

    quota.usedBytes = Math.max(0, quota.usedBytes - bytes);
    quota.usedInodes = Math.max(0, quota.usedInodes - inodes);

    if (quota.usedBytes <= quota.blockSoftLimit) {
      quota.graceExpiresAt = undefined;
    }
  }

  public getQuota(userId: string): UserDiskQuota | undefined {
    return this._quotas.get(userId);
  }
}
