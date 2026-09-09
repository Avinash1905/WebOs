/**
 * WebOS Core - POSIX Counting Semaphore & Mutex Subsystem (sem_open, sem_wait, sem_post)
 */

export class Semaphore {
  public readonly name: string;
  private value: number;
  private waiters: Array<() => void> = [];

  constructor(name: string, initialValue: number = 1) {
    this.name = name;
    this.value = Math.max(0, initialValue);
  }

  public getValue(): number {
    return this.value;
  }

  public async wait(timeoutMs: number = 5000): Promise<boolean> {
    if (this.value > 0) {
      this.value--;
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const idx = this.waiters.indexOf(fulfill);
          if (idx !== -1) this.waiters.splice(idx, 1);
          resolve(false);
        }
      }, timeoutMs);

      const fulfill = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.value--;
          resolve(true);
        }
      };

      this.waiters.push(fulfill);
    });
  }

  public post(): void {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift()!;
      this.value++;
      next();
    } else {
      this.value++;
    }
  }

  public tryWait(): boolean {
    if (this.value > 0) {
      this.value--;
      return true;
    }
    return false;
  }
}

export class SemaphoreManager {
  private static instance: SemaphoreManager;
  private semaphores: Map<string, Semaphore> = new Map();

  private constructor() {}

  public static getInstance(): SemaphoreManager {
    if (!SemaphoreManager.instance) {
      SemaphoreManager.instance = new SemaphoreManager();
    }
    return SemaphoreManager.instance;
  }

  public open(name: string, initialValue: number = 1): Semaphore {
    let sem = this.semaphores.get(name);
    if (!sem) {
      sem = new Semaphore(name, initialValue);
      this.semaphores.set(name, sem);
    }
    return sem;
  }

  public close(name: string): boolean {
    return this.semaphores.delete(name);
  }
}

export const semaphoreManager = SemaphoreManager.getInstance();
