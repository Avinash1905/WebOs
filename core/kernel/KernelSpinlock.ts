/**
 * @file KernelSpinlock.ts
 * @description Reader-Writer lock and mutex primitives for kernel-level critical sections.
 */

export class KernelSpinlock {
  private locked = false;
  private holder: string | null = null;

  public getHolder(): string | null {
    return this.holder;
  }

  public tryLock(holderId = 'kernel'): boolean {
    if (this.locked) return false;
    this.locked = true;
    this.holder = holderId;
    return true;
  }

  public async acquire(holderId = 'kernel', timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (!this.tryLock(holderId)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Spinlock acquisition timeout by ${holderId}`);
      }
      await new Promise(r => setTimeout(r, 5));
    }
  }

  public release(): void {
    this.locked = false;
    this.holder = null;
  }

  public isLocked(): boolean {
    return this.locked;
  }
}

export class KernelRWLock {
  private readers = 0;
  private writer: string | null = null;

  public async acquireRead(timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (this.writer !== null) {
      if (Date.now() - start > timeoutMs) throw new Error('RWLock read timeout');
      await new Promise(r => setTimeout(r, 5));
    }
    this.readers++;
  }

  public releaseRead(): void {
    this.readers = Math.max(0, this.readers - 1);
  }

  public async acquireWrite(holderId = 'kernel', timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (this.writer !== null || this.readers > 0) {
      if (Date.now() - start > timeoutMs) throw new Error('RWLock write timeout');
      await new Promise(r => setTimeout(r, 5));
    }
    this.writer = holderId;
  }

  public releaseWrite(): void {
    this.writer = null;
  }
}
