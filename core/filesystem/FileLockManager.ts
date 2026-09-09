/**
 * @file FileLockManager.ts
 * @description Advisory and mandatory file locking coordinator with deadlock prevention.
 */

import { FileSystemError } from './FileSystemError.js';

export type FileLockType = 'SHARED_READ' | 'EXCLUSIVE_WRITE';

export interface FileLock {
  readonly lockId: string;
  readonly path: string;
  readonly type: FileLockType;
  readonly ownerId: string;
  readonly processId?: string;
  readonly acquiredAt: number;
  readonly timeoutMs: number;
  readonly expiresAt: number;
}

export class FileLockManager {
  private readonly locks = new Map<string, FileLock[]>(); // path -> locks
  private readonly ownerLocks = new Map<string, Set<string>>(); // ownerId -> Set<lockId>
  private nextLockSeq = 1;

  public async acquireLock(
    path: string,
    type: FileLockType,
    ownerId: string,
    options?: { processId?: string; timeoutMs?: number; retryTimeoutMs?: number; retryIntervalMs?: number }
  ): Promise<FileLock> {
    const timeoutMs = options?.timeoutMs ?? 30000;
    const retryTimeoutMs = options?.retryTimeoutMs ?? 0;
    const retryIntervalMs = options?.retryIntervalMs ?? 50;
    const startTime = Date.now();

    while (true) {
      this.cleanupExpired();

      if (this.canAcquire(path, type, ownerId)) {
        const lockId = `lock_${this.nextLockSeq++}_${Date.now()}`;
        const acquiredAt = Date.now();
        const lock: FileLock = {
          lockId,
          path,
          type,
          ownerId,
          processId: options?.processId,
          acquiredAt,
          timeoutMs,
          expiresAt: acquiredAt + timeoutMs
        };

        const existing = this.locks.get(path) ?? [];
        existing.push(lock);
        this.locks.set(path, existing);

        if (!this.ownerLocks.has(ownerId)) {
          this.ownerLocks.set(ownerId, new Set());
        }
        this.ownerLocks.get(ownerId)!.add(lockId);

        return lock;
      }

      if (Date.now() - startTime >= retryTimeoutMs) {
        throw new FileSystemError('EBUSY', `Failed to acquire ${type} lock on ${path} within ${retryTimeoutMs}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
    }
  }

  public releaseLock(lockId: string): boolean {
    for (const [path, lockList] of this.locks.entries()) {
      const idx = lockList.findIndex(l => l.lockId === lockId);
      if (idx !== -1) {
        const lock = lockList[idx];
        if (!lock) return false;
        lockList.splice(idx, 1);
        if (lockList.length === 0) {
          this.locks.delete(path);
        }

        const ownerSet = this.ownerLocks.get(lock.ownerId);
        if (ownerSet) {
          ownerSet.delete(lockId);
          if (ownerSet.size === 0) {
            this.ownerLocks.delete(lock.ownerId);
          }
        }
        return true;
      }
    }
    return false;
  }

  public releaseAllForOwner(ownerId: string): number {
    const lockIds = this.ownerLocks.get(ownerId);
    if (!lockIds) return 0;

    let count = 0;
    for (const lockId of Array.from(lockIds)) {
      if (this.releaseLock(lockId)) {
        count++;
      }
    }
    return count;
  }

  public getLocksForPath(path: string): readonly FileLock[] {
    this.cleanupExpired();
    return this.locks.get(path) ?? [];
  }

  public isLocked(path: string, type?: FileLockType): boolean {
    this.cleanupExpired();
    const locks = this.locks.get(path);
    if (!locks || locks.length === 0) return false;
    if (!type) return true;
    return locks.some(l => l.type === type);
  }

  private canAcquire(path: string, type: FileLockType, ownerId: string): boolean {
    const locks = this.locks.get(path);
    if (!locks || locks.length === 0) return true;

    if (type === 'EXCLUSIVE_WRITE') {
      // Can only acquire if there are no locks or the only lock is a shared lock by the same owner
      return locks.length === 1 && locks[0]?.ownerId === ownerId;
    } else {
      // Shared read lock can be acquired if all current locks are shared read locks or exclusive by same owner
      return locks.every(l => l.type === 'SHARED_READ' || l.ownerId === ownerId);
    }
  }

  public cleanupExpired(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [path, lockList] of Array.from(this.locks.entries())) {
      const active = lockList.filter(l => l.expiresAt > now);
      const expired = lockList.filter(l => l.expiresAt <= now);

      for (const exp of expired) {
        expiredCount++;
        const ownerSet = this.ownerLocks.get(exp.ownerId);
        if (ownerSet) {
          ownerSet.delete(exp.lockId);
          if (ownerSet.size === 0) {
            this.ownerLocks.delete(exp.ownerId);
          }
        }
      }

      if (active.length === 0) {
        this.locks.delete(path);
      } else {
        this.locks.set(path, active);
      }
    }

    return expiredCount;
  }

  public clear(): void {
    this.locks.clear();
    this.ownerLocks.clear();
  }
}
