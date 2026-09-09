/**
 * @file TrashAuditTrail.ts
 * @description Cryptographically hash-chained tamper-evident audit log for trash operations.
 */

export type TrashAuditAction = 'TRASH' | 'RESTORE' | 'PURGE' | 'EMPTY' | 'RENAME' | 'TAG';

export interface TrashAuditEvent {
  readonly index: number;
  readonly timestamp: number;
  readonly action: TrashAuditAction;
  readonly itemId: string;
  readonly path: string;
  readonly userId: string;
  readonly details?: Record<string, unknown>;
  readonly previousHash: string;
  readonly hash: string;
}

/**
 * Immutable hash-chained audit log guaranteeing non-repudiation of trash actions.
 */
export class TrashAuditTrail {
  private readonly _log: TrashAuditEvent[] = [];
  private _lastHash = 'GENESIS_HASH_00000000000000000000000000000000';

  /**
   * Records an audit event and appends it to the chain.
   */
  public record(
    action: TrashAuditAction,
    itemId: string,
    path: string,
    userId: string,
    details?: Record<string, unknown>
  ): TrashAuditEvent {
    const index = this._log.length;
    const timestamp = Date.now();
    const previousHash = this._lastHash;

    const payload = JSON.stringify({ index, timestamp, action, itemId, path, userId, details, previousHash });
    const hash = this.computeHash(payload);

    const event: TrashAuditEvent = {
      index,
      timestamp,
      action,
      itemId,
      path,
      userId,
      details,
      previousHash,
      hash,
    };

    this._log.push(event);
    this._lastHash = hash;
    return event;
  }

  /**
   * Validates integrity of the entire audit chain.
   */
  public verifyIntegrity(): { valid: boolean; brokenIndex?: number } {
    let prev = 'GENESIS_HASH_00000000000000000000000000000000';
    for (let i = 0; i < this._log.length; i++) {
      const event = this._log[i];
      if (!event) continue;
      if (event.previousHash !== prev) {
        return { valid: false, brokenIndex: i };
      }
      const payload = JSON.stringify({
        index: event.index,
        timestamp: event.timestamp,
        action: event.action,
        itemId: event.itemId,
        path: event.path,
        userId: event.userId,
        details: event.details,
        previousHash: event.previousHash,
      });
      const computed = this.computeHash(payload);
      if (computed !== event.hash) {
        return { valid: false, brokenIndex: i };
      }
      prev = event.hash;
    }
    return { valid: true };
  }

  /**
   * Returns all recorded audit events.
   */
  public getEvents(): readonly TrashAuditEvent[] {
    return [...this._log];
  }

  /**
   * Retrieves events for a specific item.
   */
  public getEventsForItem(itemId: string): TrashAuditEvent[] {
    return this._log.filter((e) => e.itemId === itemId);
  }

  /**
   * Computes a deterministic 64-bit hex hash.
   */
  private computeHash(str: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  }
}
