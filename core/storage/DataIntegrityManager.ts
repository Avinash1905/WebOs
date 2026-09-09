/**
 * @file DataIntegrityManager.ts
 * @description Data integrity validation, checksum generation, and corruption recovery.
 */

export class DataIntegrityManager {
  /**
   * Computes a fast CRC32-like checksum for serialized data.
   */
  public static computeChecksum(data: string | Uint8Array): number {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    let crc = 0 ^ -1;

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]!;
      crc = (crc >>> 8) ^ this._crcTable[(crc ^ byte) & 0xff]!;
    }

    return (crc ^ -1) >>> 0;
  }

  /**
   * Validates stored payload checksum.
   */
  public static verifyChecksum(data: string | Uint8Array, expectedChecksum: number): boolean {
    return this.computeChecksum(data) === expectedChecksum;
  }

  private static readonly _crcTable: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();
}
