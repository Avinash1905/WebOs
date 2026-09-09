/**
 * @file Deserializer.ts
 * @description Type-safe deserialization layer for WebOS storage values.
 */

import { StorageSerializationError } from './StorageError.js';

/**
 * Reconstructs JSON strings back into JavaScript objects, primitives, dates, binary buffers, maps, and sets.
 */
export class Deserializer {
  /**
   * Deserializes a JSON string into its strongly-typed JavaScript object representation.
   *
   * @template T - Expected return type.
   * @param raw - The serialized string.
   * @returns The deserialized value.
   * @throws {StorageSerializationError} If the string is invalid JSON or cannot be reconstructed.
   */
  public static deserialize<T = unknown>(raw: string): T {
    if (typeof raw !== 'string') {
      throw new StorageSerializationError('unknown', 'Input to deserialize must be a string.');
    }

    try {
      return JSON.parse(raw, (_key, val) => {
        if (typeof val === 'object' && val !== null && '__t' in val) {
          const tagged = val as { __t: string; [k: string]: unknown };
          switch (tagged.__t) {
            case 'BigInt':
              return BigInt(tagged['v'] as string);
            case 'Date':
              return new Date(tagged['v'] as string);
            case 'RegExp':
              return new RegExp(tagged['s'] as string, tagged['f'] as string);
            case 'Uint8Array':
              return new Uint8Array(tagged['b'] as number[]);
            case 'ArrayBuffer':
              return new Uint8Array(tagged['b'] as number[]).buffer;
            case 'Map':
              return new Map(tagged['e'] as [unknown, unknown][]);
            case 'Set':
              return new Set(tagged['v'] as unknown[]);
          }
        }
        return val;
      }) as T;
    } catch (err) {
      throw new StorageSerializationError(
        'json',
        `Failed to deserialize value: ${err instanceof Error ? err.message : String(err)}`,
        err
      );
    }
  }
}
