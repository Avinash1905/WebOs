/**
 * @file TwoPhaseCommitManager.ts
 * @description Two-Phase Commit (2PC) distributed transaction coordinator.
 */

export type TransactionPhase = 'INIT' | 'PREPARE' | 'COMMITTED' | 'ABORTED';

export class TwoPhaseCommitManager {
  private _phase: TransactionPhase = 'INIT';
  private readonly _participants = new Set<string>();
  private readonly _votes = new Map<string, boolean>();

  public registerParticipant(participantId: string): void {
    this._participants.add(participantId);
  }

  public vote(participantId: string, canCommit: boolean): void {
    if (this._participants.has(participantId)) {
      this._votes.set(participantId, canCommit);
    }
  }

  public executeCoordinatorPhase(): TransactionPhase {
    this._phase = 'PREPARE';

    if (this._votes.size < this._participants.size) {
      return this._phase; // Still waiting for votes
    }

    let allYes = true;
    for (const v of this._votes.values()) {
      if (!v) {
        allYes = false;
        break;
      }
    }

    this._phase = allYes ? 'COMMITTED' : 'ABORTED';
    return this._phase;
  }

  public get phase(): TransactionPhase {
    return this._phase;
  }
}
