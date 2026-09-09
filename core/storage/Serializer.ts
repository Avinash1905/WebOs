/**
 * @file Serializer.ts
 * @description Type-safe serialization layer for WebOS storage values.
 */

import { StorageSerializationError } from './StorageError.js';

/**
 * Transforms runtime objects, primitives, dates, binary buffers, maps, and sets into JSON strings.
 */
export class Serializer {
  /**
   * Serializes a JavaScript value into a JSON string with type tags for special objects.
   *
   * @param value - Value to serialize.
   * @throws {StorageSerializationError} If the value contains functions, symbols, or cyclic references.
   */
  public static serialize(value: unknown): string {
    const seen = new WeakSet();

    try {
      return JSON.stringify(value, function (_key, val) {
        // Access raw value on container before Date.prototype.toJSON converts it
        const rawVal = this && _key ? (this as Record<string, unknown>)[_key] : val;

        if (typeof rawVal === 'function' || typeof val === 'function') {
          throw new StorageSerializationError('function', 'Functions cannot be serialized to storage.');
        }
        if (typeof rawVal === 'symbol' || typeof val === 'symbol') {
          throw new StorageSerializationError('symbol', 'Symbols cannot be serialized to storage.');
        }
        if (typeof rawVal === 'bigint' || typeof val === 'bigint') {
          return { __t: 'BigInt', v: (rawVal ?? val).toString() };
        }
        if (rawVal instanceof Date || val instanceof Date) {
          return { __t: 'Date', v: (rawVal instanceof Date ? rawVal : (val as Date)).toISOString() };
        }
        if (rawVal instanceof RegExp || val instanceof RegExp) {
          const r = rawVal instanceof RegExp ? rawVal : (val as RegExp);
          return { __t: 'RegExp', s: r.source, f: r.flags };
        }
        if (rawVal instanceof Uint8Array || val instanceof Uint8Array) {
          const u = rawVal instanceof Uint8Array ? rawVal : (val as Uint8Array);
          return { __t: 'Uint8Array', b: Array.from(u) };
        }
        if (rawVal instanceof ArrayBuffer || val instanceof ArrayBuffer) {
          const b = rawVal instanceof ArrayBuffer ? rawVal : (val as ArrayBuffer);
          return { __t: 'ArrayBuffer', b: Array.from(new Uint8Array(b)) };
        }
        if (rawVal instanceof Map || val instanceof Map) {
          const m = rawVal instanceof Map ? rawVal : (val as Map<unknown, unknown>);
          return { __t: 'Map', e: Array.from(m.entries()) };
        }
        if (rawVal instanceof Set || val instanceof Set) {
          const s = rawVal instanceof Set ? rawVal : (val as Set<unknown>);
          return { __t: 'Set', v: Array.from(s.values()) };
        }

        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            throw new StorageSerializationError('object', 'Circular reference detected during serialization.');
          }
          seen.add(val);
        }

        return val;
      });
    } catch (err) {
      if (err instanceof StorageSerializationError) {
        throw err;
      }
      throw new StorageSerializationError(
        typeof value,
        err instanceof Error ? err.message : String(err),
        err
      );
    }
  }
}
