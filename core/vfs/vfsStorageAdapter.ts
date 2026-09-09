/**
 * WebOS Core - VFS Storage Persistence Adapters
 * Provides local storage, IndexedDB, and in-memory persistence drivers with backup/snapshot export.
 */

import { StoragePersistenceAdapter } from './types';

export class MemoryStorageAdapter implements StoragePersistenceAdapter {
  public readonly name = 'memory';
  private storage: Map<string, Uint8Array> = new Map();

  async save(key: string, data: Uint8Array): Promise<boolean> {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    this.storage.set(key, copy);
    return true;
  }

  async load(key: string): Promise<Uint8Array | null> {
    const data = this.storage.get(key);
    if (!data) return null;
    const copy = new Uint8Array(data.length);
    copy.set(data);
    return copy;
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async listKeys(prefix: string = ''): Promise<string[]> {
    const keys: string[] = [];
    for (const k of this.storage.keys()) {
      if (!prefix || k.startsWith(prefix)) {
        keys.push(k);
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

export class LocalStorageVFSAdapter implements StoragePersistenceAdapter {
  public readonly name = 'localstorage';
  private prefix = 'webos_vfs_data_';

  private encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  }

  private decodeBase64(str: string): Uint8Array {
    const binary = typeof atob !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async save(key: string, data: Uint8Array): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    try {
      const encoded = this.encodeBase64(data);
      localStorage.setItem(this.prefix + key, encoded);
      return true;
    } catch {
      return false;
    }
  }

  async load(key: string): Promise<Uint8Array | null> {
    if (typeof localStorage === 'undefined') return null;
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      return this.decodeBase64(item);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch {
      return false;
    }
  }

  async listKeys(prefix: string = ''): Promise<string[]> {
    if (typeof localStorage === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        const pureKey = k.substring(this.prefix.length);
        if (!prefix || pureKey.startsWith(prefix)) {
          keys.push(pureKey);
        }
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        keysToDelete.push(k);
      }
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
  }
}
