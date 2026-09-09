import { describe, expect, it } from 'vitest';
import {
  TrashTransactionJournal,
  TrashCryptographicShredder,
} from '../../core/trash/index.js';

describe('Trash Enterprise Engines', () => {
  it('TrashTransactionJournal commits transactions and reverses ops upon rollback', () => {
    const journal = new TrashTransactionJournal();
    const txId = journal.beginTransaction();

    journal.recordOp(txId, { opType: 'TRASH', itemId: 'f1', path: '/docs/f1.txt' });
    journal.recordOp(txId, { opType: 'TRASH', itemId: 'f2', path: '/docs/f2.txt' });

    expect(journal.commit(txId)).toBe(true);
    expect(journal.getTransaction(txId)?.state).toBe('COMMITTED');

    const txRollbackId = journal.beginTransaction();
    journal.recordOp(txRollbackId, { opType: 'PURGE', itemId: 'f3', path: '/docs/f3.txt' });
    journal.recordOp(txRollbackId, { opType: 'PURGE', itemId: 'f4', path: '/docs/f4.txt' });

    const undoOps = journal.rollback(txRollbackId);
    expect(undoOps.length).toBe(2);
    expect(undoOps[0]!.itemId).toBe('f4'); // Reversed order
    expect(journal.getTransaction(txRollbackId)?.state).toBe('ROLLED_BACK');
  });

  it('TrashCryptographicShredder completes multiple data overwrite passes', () => {
    const data = 'Super secret classified encryption key payload 12345';
    const result = TrashCryptographicShredder.shred(data, 3);

    expect(result.passesCompleted).toBe(3);
    expect(result.finalWipedLength).toBe(data.length);
  });
});
