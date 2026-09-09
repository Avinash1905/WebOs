/**
 * @file ShadowPasswordManager.ts
 * @description UNIX-compatible /etc/shadow password database simulation with salt and aging.
 */

export interface ShadowEntry {
  readonly username: string;
  passwordHash: string; // $6$salt$hash (SHA-512 simulation)
  lastChangedDays: number;
  minDays: number;
  maxDays: number;
  warnDays: number;
  inactiveDays: number;
  expireDays: number;
}

export class ShadowPasswordManager {
  private readonly _entries = new Map<string, ShadowEntry>();

  public createEntry(username: string, plainTextPassword: string): ShadowEntry {
    const salt = Math.random().toString(36).substring(2, 10);
    const hash = this.hashPassword(plainTextPassword, salt);
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    const entry: ShadowEntry = {
      username,
      passwordHash: `$6$${salt}$${hash}`,
      lastChangedDays: daysSinceEpoch,
      minDays: 0,
      maxDays: 90,
      warnDays: 7,
      inactiveDays: 30,
      expireDays: -1,
    };

    this._entries.set(username, entry);
    return entry;
  }

  public verifyPassword(username: string, plainTextPassword: string): boolean {
    const entry = this._entries.get(username);
    if (!entry) return false;

    const parts = entry.passwordHash.split('$');
    if (parts.length < 4) return false;
    const salt = parts[2];
    const expectedHash = parts[3];
    if (!salt || !expectedHash) return false;

    const computed = this.hashPassword(plainTextPassword, salt);
    return computed === expectedHash;
  }

  public updatePassword(username: string, newPlainText: string): boolean {
    const entry = this._entries.get(username);
    if (!entry) return false;

    const salt = Math.random().toString(36).substring(2, 10);
    const hash = this.hashPassword(newPlainText, salt);
    entry.passwordHash = `$6$${salt}$${hash}`;
    entry.lastChangedDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return true;
  }

  private hashPassword(plain: string, salt: string): string {
    let h = 0x811c9dc5;
    const combined = `${salt}:${plain}:${salt}`;
    for (let i = 0; i < combined.length; i++) {
      h ^= combined.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0') + '_hashed_sha512';
  }

  public getEntry(username: string): ShadowEntry | undefined {
    return this._entries.get(username);
  }
}
