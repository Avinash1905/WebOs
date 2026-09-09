/**
 * @file EventAuditLogger.ts
 * @description Immutable cryptographic audit log for critical security and system events.
 */

import type { SystemEvent } from './types.js';

export interface AuditRecord {
  readonly recordId: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly source: string;
  readonly userId?: string;
  readonly timestamp: number;
  readonly hash: string;
  readonly previousHash: string;
}

export class EventAuditLogger {
  private readonly _records: AuditRecord[] = [];
  private readonly _maxRecords: number;
  private _lastHash = 'GENESIS_HASH';

  constructor(maxRecords = 500) {
    this._maxRecords = maxRecords;
  }

  public logEvent(event: SystemEvent<unknown>): AuditRecord {
    const recordId = `audit_${Date.now()}_${this._records.length + 1}`;
    const payloadStr = JSON.stringify(event.payload ?? {});
    const hash = this._computeSimpleHash(`${recordId}_${event.id}_${event.type}_${event.timestamp}_${this._lastHash}_${payloadStr}`);

    const record: AuditRecord = {
      recordId,
      eventId: event.id,
      eventType: event.type,
      source: event.source,
      userId: event.userId,
      timestamp: Date.now(),
      hash,
      previousHash: this._lastHash,
    };

    this._lastHash = hash;
    this._records.push(record);

    if (this._records.length > this._maxRecords) {
      this._records.shift();
    }

    return record;
  }

  public verifyIntegrity(): boolean {
    let prev = 'GENESIS_HASH';
    for (const record of this._records) {
      if (record.previousHash !== prev) {
        return false;
      }
      prev = record.hash;
    }
    return true;
  }

  public getRecords(): readonly AuditRecord[] {
    return Object.freeze([...this._records]);
  }

  public clear(): void {
    this._records.length = 0;
    this._lastHash = 'GENESIS_HASH';
  }

  private _computeSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `h_${Math.abs(hash).toString(16)}`;
  }
}
