/**
 * WebOS Backend - Cryptographic Password Hasher
 * High-security password derivation using Node.js native crypto (scrypt / PBKDF2).
 * Constant-time timingSafeEqual verification prevents timing attacks.
 */

import crypto from 'node:crypto';

export interface HashResult {
  readonly hash: string;
  readonly salt: string;
  readonly algorithm: 'scrypt' | 'pbkdf2';
}

export interface PasswordHasherOptions {
  readonly pepper?: string;
  readonly scryptCost?: number; // N: default 16384
  readonly scryptBlockSize?: number; // r: default 8
  readonly scryptParallelism?: number; // p: default 1
  readonly keyLength?: number; // default 64 bytes
  readonly saltLength?: number; // default 32 bytes
}

export class PasswordHasher {
  private readonly pepper: string;
  private readonly scryptCost: number;
  private readonly scryptBlockSize: number;
  private readonly scryptParallelism: number;
  private readonly keyLength: number;
  private readonly saltLength: number;

  constructor(options: PasswordHasherOptions = {}) {
    this.pepper = options.pepper ?? '';
    this.scryptCost = options.scryptCost ?? 16384;
    this.scryptBlockSize = options.scryptBlockSize ?? 8;
    this.scryptParallelism = options.scryptParallelism ?? 1;
    this.keyLength = options.keyLength ?? 64;
    this.saltLength = options.saltLength ?? 32;
  }

  /**
   * Hashes a password using scrypt with a cryptographically secure random salt.
   */
  public async hashPassword(password: string): Promise<HashResult> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    const salt = crypto.randomBytes(this.saltLength).toString('hex');
    const peppered = this.applyPepper(password);

    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(
        peppered,
        salt,
        this.keyLength,
        {
          N: this.scryptCost,
          r: this.scryptBlockSize,
          p: this.scryptParallelism,
          maxmem: 64 * 1024 * 1024
        },
        (err, key) => {
          if (err) reject(err);
          else resolve(key as Buffer);
        }
      );
    });

    return {
      hash: derivedKey.toString('hex'),
      salt,
      algorithm: 'scrypt'
    };
  }

  /**
   * Verifies a plain password against an existing hash and salt.
   * Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
   */
  public async verifyPassword(
    password: string,
    storedHash: string,
    salt: string,
    algorithm: string = 'scrypt'
  ): Promise<boolean> {
    if (!password || !storedHash || !salt) {
      return false;
    }

    try {
      const peppered = this.applyPepper(password);
      let derivedBuffer: Buffer;

      if (algorithm === 'pbkdf2') {
        derivedBuffer = await new Promise<Buffer>((resolve, reject) => {
          crypto.pbkdf2(
            peppered,
            salt,
            100000,
            this.keyLength,
            'sha512',
            (err, key) => {
              if (err) reject(err);
              else resolve(key);
            }
          );
        });
      } else {
        // default scrypt
        derivedBuffer = await new Promise<Buffer>((resolve, reject) => {
          crypto.scrypt(
            peppered,
            salt,
            this.keyLength,
            {
              N: this.scryptCost,
              r: this.scryptBlockSize,
              p: this.scryptParallelism,
              maxmem: 64 * 1024 * 1024
            },
            (err, key) => {
              if (err) reject(err);
              else resolve(key as Buffer);
            }
          );
        });
      }

      const storedBuffer = Buffer.from(storedHash, 'hex');
      if (storedBuffer.length !== derivedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
    } catch {
      return false;
    }
  }

  private applyPepper(password: string): string {
    if (!this.pepper) {
      return password;
    }
    return crypto.createHmac('sha256', this.pepper).update(password).digest('hex');
  }
}

export const defaultPasswordHasher = new PasswordHasher();
