/**
 * @file EncryptedStorageAdapter.ts
 * @description Encrypted storage wrapper encrypting payloads using symmetric key simulation.
 */

export class EncryptedStorageAdapter {
  constructor(private readonly secretKey: string) {}

  public encrypt(data: string): string {
    // Pure fast obfuscation simulation
    const encoded = new TextEncoder().encode(data);
    const keyBytes = new TextEncoder().encode(this.secretKey);
    const result = new Uint8Array(encoded.length);

    for (let i = 0; i < encoded.length; i++) {
      result[i] = encoded[i]! ^ keyBytes[i % keyBytes.length]!;
    }

    return `enc_${Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  public decrypt(cipherText: string): string {
    if (!cipherText.startsWith('enc_')) return cipherText;
    const hex = cipherText.slice(4);
    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    const keyBytes = new TextEncoder().encode(this.secretKey);
    const decrypted = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      decrypted[i] = bytes[i]! ^ keyBytes[i % keyBytes.length]!;
    }

    return new TextDecoder().decode(decrypted);
  }
}
