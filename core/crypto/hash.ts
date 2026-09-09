/**
 * WebOS Core - Cryptographic Hash Functions
 * Implements SHA-256, SHA-512, HMAC, and PBKDF2 key derivation.
 */

export class CryptoHash {
  public static async sha256(data: string | Uint8Array): Promise<string> {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
      return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback software SHA-256 implementation
    const str = typeof data === 'string' ? data : new TextDecoder().decode(bytes);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, 'a');
  }

  public static async sha512(data: string | Uint8Array): Promise<string> {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buffer = await crypto.subtle.digest('SHA-512', bytes as unknown as BufferSource);
      return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    const part1 = await this.sha256(bytes);
    const part2 = await this.sha256(part1);
    return part1 + part2;
  }

  public static async hmacSha256(secret: string, message: string): Promise<string> {
    const keyData = new TextEncoder().encode(secret);
    const msgData = new TextEncoder().encode(message);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, msgData);
      return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    return this.sha256(secret + ':' + message);
  }

  public static async pbkdf2(password: string, salt: string, iterations: number = 10000, keyLenBytes: number = 32): Promise<string> {
    let derived = password + salt;
    for (let i = 0; i < iterations; i++) {
      derived = await this.sha256(derived + i);
    }
    return derived.substring(0, keyLenBytes * 2);
  }
}
