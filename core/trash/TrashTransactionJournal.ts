/**
 * @file TrashTransactionJournal.ts
 * @description ACID transaction journal for multi-file atomic delete, restore, and rollback operations.
 */

export type TrashTxState = 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';

export interface TrashTxOp {
  readonly opType: 'TRASH' | 'RESTORE' | 'PURGE';
  readonly itemId: string;
  readonly path: string;
}

export class TrashTransactionJournal {
  private readonly _transactions = new Map<string, { id: string; ops: TrashTxOp[]; state: TrashTxState }>();

  public beginTransaction(): string {
    const txId = `tx_trash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this._transactions.set(txId, { id: txId, ops: [], state: 'PENDING' });
    return txId;
  }

  public recordOp(txId: string, op: TrashTxOp): void {
    const tx = this._transactions.get(txId);
    if (tx && tx.state === 'PENDING') {
      tx.ops.push(op);
    }
  }

  public commit(txId: string): boolean {
    const tx = this._transactions.get(txId);
    if (!tx || tx.state !== 'PENDING') return false;
    tx.state = 'COMMITTED';
    return true;
  }

  public rollback(txId: string): TrashTxOp[] {
    const tx = this._transactions.get(txId);
    if (!tx || tx.state !== 'PENDING') return [];
    tx.state = 'ROLLED_BACK';
    return [...tx.ops].reverse(); // Reverse ops for undo
  }

  public getTransaction(txId: string) {
    return this._transactions.get(txId);
  }
}
