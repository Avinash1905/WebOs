/**
 * WebOS Core - Entropy Pool & CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
 */

export class EntropyPool {
  private static instance: EntropyPool;
  private pool: Uint8Array = new Uint8Array(512);
  private poolIndex: number = 0;

  private constructor() {
    this.seedFromEnvironment();
  }

  public static getInstance(): EntropyPool {
    if (!EntropyPool.instance) {
      EntropyPool.instance = new EntropyPool();
    }
    return EntropyPool.instance;
  }

  private seedFromEnvironment(): void {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(this.pool);
    } else {
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i] = (Math.random() * 256) ^ (Date.now() & 0xFF) ^ (i * 37);
      }
    }
  }

  public addEntropy(source: number | string): void {
    const val = typeof source === 'string'
      ? source.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : Math.floor(source);

    this.pool[this.poolIndex] ^= (val & 0xFF);
    this.poolIndex = (this.poolIndex + 1) % this.pool.length;
  }

  public getRandomBytes(length: number): Uint8Array {
    const result = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(result);
      return result;
    }

    for (let i = 0; i < length; i++) {
      this.poolIndex = (this.poolIndex + 1) % this.pool.length;
      result[i] = this.pool[this.poolIndex];
      this.pool[this.poolIndex] = (this.pool[this.poolIndex] * 1664525 + 1013904223) & 0xFF;
    }
    return result;
  }

  public getRandomUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    const bytes = this.getRandomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}

export const entropyPool = EntropyPool.getInstance();
