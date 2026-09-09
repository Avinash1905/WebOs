/**
 * WebOS Backend - Tamper-Evident Audit Logging Service (SIEM)
 * Uses cryptographic hash chaining (SHA-256) to ensure immutable, verifiable audit trails.
 */

import { CryptoHash } from '../../core/crypto/hash';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SECURITY_ALERT';

export interface AuditEvent {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  actorUserId: string;
  actorIp: string;
  action: string;
  resource: string;
  severity: AuditSeverity;
  details: Record<string, any>;
  previousHash: string;
  hash: string;
}

export class AuditService {
  private static instance: AuditService;
  private logs: AuditEvent[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';
  private sequenceCounter: number = 0;

  private constructor() {
    this.seedInitialAuditLog();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private async seedInitialAuditLog(): Promise<void> {
    await this.log({
      actorUserId: 'system-kernel',
      actorIp: '127.0.0.1',
      action: 'SYSTEM_BOOT',
      resource: 'kernel:init',
      severity: 'INFO',
      details: { version: '2.1.0-lts', mode: 'secure_enclave' },
    });
  }

  public async log(params: {
    actorUserId: string;
    actorIp?: string;
    action: string;
    resource: string;
    severity: AuditSeverity;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    this.sequenceCounter++;
    const sequenceNumber = this.sequenceCounter;
    const timestamp = Date.now();
    const id = `audit-${timestamp}-${sequenceNumber}`;
    const actorIp = params.actorIp || '127.0.0.1';
    const details = params.details || {};
    const previousHash = this.lastHash;

    const payloadToHash = `${id}|${sequenceNumber}|${timestamp}|${params.actorUserId}|${actorIp}|${params.action}|${params.resource}|${params.severity}|${JSON.stringify(details)}|${previousHash}`;
    const hash = await CryptoHash.sha256(payloadToHash);

    const event: AuditEvent = {
      id,
      sequenceNumber,
      timestamp,
      actorUserId: params.actorUserId,
      actorIp,
      action: params.action,
      resource: params.resource,
      severity: params.severity,
      details,
      previousHash,
      hash,
    };

    this.logs.push(event);
    this.lastHash = hash;
    return event;
  }

  public async verifyIntegrity(): Promise<{ valid: boolean; brokenAtSequence?: number; reason?: string }> {
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const entry of this.logs) {
      if (entry.previousHash !== prevHash) {
        return {
          valid: false,
          brokenAtSequence: entry.sequenceNumber,
          reason: `Previous hash mismatch at sequence #${entry.sequenceNumber}`,
        };
      }

      const payload = `${entry.id}|${entry.sequenceNumber}|${entry.timestamp}|${entry.actorUserId}|${entry.actorIp}|${entry.action}|${entry.resource}|${entry.severity}|${JSON.stringify(entry.details)}|${entry.previousHash}`;
      const computedHash = await CryptoHash.sha256(payload);

      if (computedHash !== entry.hash) {
        return {
          valid: false,
          brokenAtSequence: entry.sequenceNumber,
          reason: `Tampered hash at sequence #${entry.sequenceNumber}`,
        };
      }

      prevHash = entry.hash;
    }

    return { valid: true };
  }

  public query(filter: {
    actorUserId?: string;
    severity?: AuditSeverity;
    action?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
    limit?: number;
  }): AuditEvent[] {
    let result = this.logs;

    if (filter.actorUserId) {
      result = result.filter((e) => e.actorUserId === filter.actorUserId);
    }
    if (filter.severity) {
      result = result.filter((e) => e.severity === filter.severity);
    }
    if (filter.action) {
      result = result.filter((e) => e.action.toLowerCase().includes(filter.action!.toLowerCase()));
    }
    if (filter.fromTimestamp) {
      result = result.filter((e) => e.timestamp >= filter.fromTimestamp!);
    }
    if (filter.toTimestamp) {
      result = result.filter((e) => e.timestamp <= filter.toTimestamp!);
    }

    const limit = filter.limit || 100;
    return result.slice(-limit);
  }

  public exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditService = AuditService.getInstance();
