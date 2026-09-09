/**
 * WebOS Database Engine - Write-Ahead Log (WAL) & ACID Transaction Manager
 */

export type WALRecordType = 'BEGIN' | 'INSERT' | 'UPDATE' | 'DELETE' | 'COMMIT' | 'ABORT' | 'CHECKPOINT';

export interface WALRecord {
  lsn: number; // Log Sequence Number
  txId: string;
  type: WALRecordType;
  tableName?: string;
  rowId?: string | number;
  beforeImage?: Record<string, any>;
  afterImage?: Record<string, any>;
  timestamp: number;
}

export class WALJournal {
  private static instance: WALJournal;
  private records: WALRecord[] = [];
  private currentLSN: number = 0;
  private activeTransactions: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): WALJournal {
    if (!WALJournal.instance) {
      WALJournal.instance = new WALJournal();
    }
    return WALJournal.instance;
  }

  public beginTransaction(): string {
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.activeTransactions.add(txId);
    this.appendRecord({
      txId,
      type: 'BEGIN',
      timestamp: Date.now(),
    });
    return txId;
  }

  public logOperation(params: {
    txId: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    rowId: string | number;
    beforeImage?: Record<string, any>;
    afterImage?: Record<string, any>;
  }): number {
    return this.appendRecord({
      txId: params.txId,
      type: params.type,
      tableName: params.tableName,
      rowId: params.rowId,
      beforeImage: params.beforeImage,
      afterImage: params.afterImage,
      timestamp: Date.now(),
    });
  }

  public commit(txId: string): number {
    this.activeTransactions.delete(txId);
    return this.appendRecord({
      txId,
      type: 'COMMIT',
      timestamp: Date.now(),
    });
  }

  public abort(txId: string): number {
    this.activeTransactions.delete(txId);
    return this.appendRecord({
      txId,
      type: 'ABORT',
      timestamp: Date.now(),
    });
  }

  private appendRecord(record: Omit<WALRecord, 'lsn'>): number {
    this.currentLSN++;
    const fullRecord: WALRecord = {
      ...record,
      lsn: this.currentLSN,
    };
    this.records.push(fullRecord);
    return this.currentLSN;
  }

  public checkpoint(): void {
    this.appendRecord({
      txId: 'system',
      type: 'CHECKPOINT',
      timestamp: Date.now(),
    });
  }

  public getHistory(): WALRecord[] {
    return this.records;
  }
}

export const walJournal = WALJournal.getInstance();
