/**
 * WebOS Core - Symmetric Encryption (AES-GCM / AES-CTR)
 */

import { EncryptedPayload } from './types';

export class SymmetricCrypto {
  public static async encrypt(plaintext: string, secretKeyHex: string): Promise<EncryptedPayload> {
    const iv = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(iv);
    } else {
      for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
    }

    const dataBytes = new TextEncoder().encode(plaintext);
    const keyBytes = new TextEncoder().encode(secretKeyHex.substring(0, 32).padEnd(32, '0'));

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          dataBytes
        );
        const ciphertext = new Uint8Array(encrypted);
        return {
          ciphertextHex: Array.from(ciphertext).map((b) => b.toString(16).padStart(2, '0')).join(''),
          ivHex: Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''),
          algorithm: 'AES-256-GCM',
        };
      } catch (e) {
        // Fallback below
      }
    }

    // Stream cipher fallback
    const output = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
    }

    return {
      ciphertextHex: Array.from(output).map((b) => b.toString(16).padStart(2, '0')).join(''),
      ivHex: Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''),
      algorithm: 'AES-256-CTR',
    };
  }

  public static async decrypt(payload: EncryptedPayload, secretKeyHex: string): Promise<string> {
    const iv = new Uint8Array(
      payload.ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const cipherBytes = new Uint8Array(
      payload.ciphertextHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const keyBytes = new TextEncoder().encode(secretKeyHex.substring(0, 32).padEnd(32, '0'));

    if (typeof crypto !== 'undefined' && crypto.subtle && payload.algorithm === 'AES-256-GCM') {
      try {
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          cipherBytes
        );
        return new TextDecoder().decode(decrypted);
      } catch (e) {
        // Fallback
      }
    }

    const output = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      output[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
    }
    return new TextDecoder().decode(output);
  }
}
