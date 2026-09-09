/**
 * @file SecurityAuditPolicy.ts
 * @description Real-time security event telemetry and policy breach auditing engine.
 */

export interface SecurityAuditRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  readonly subject: string; // pid or username
  readonly action: string;
  readonly objectResource: string;
  readonly result: 'GRANTED' | 'DENIED';
  readonly reason?: string;
}

export class SecurityAuditPolicy {
  private readonly _records: SecurityAuditRecord[] = [];
  private readonly _listeners: ((record: SecurityAuditRecord) => void)[] = [];
  private _maxRecords = 1000;

  public logEvent(
    severity: SecurityAuditRecord['severity'],
    subject: string,
    action: string,
    objectResource: string,
    result: SecurityAuditRecord['result'],
    reason?: string
  ): SecurityAuditRecord {
    const record: SecurityAuditRecord = {
      id: `sec_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      severity,
      subject,
      action,
      objectResource,
      result,
      reason,
    };

    this._records.push(record);
    if (this._records.length > this._maxRecords) {
      this._records.shift();
    }

    for (const listener of this._listeners) {
      try {
        listener(record);
      } catch {
        // Ignore listener error
      }
    }

    return record;
  }

  public getDeniedEvents(): SecurityAuditRecord[] {
    return this._records.filter((r) => r.result === 'DENIED');
  }

  public getRecent(count: number = 50): SecurityAuditRecord[] {
    return this._records.slice(-count);
  }

  public onAudit(listener: (record: SecurityAuditRecord) => void): () => void {
    this._listeners.push(listener);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  public clear(): void {
    this._records.length = 0;
  }
}
