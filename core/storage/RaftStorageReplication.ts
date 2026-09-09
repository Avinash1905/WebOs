/**
 * @file RaftStorageReplication.ts
 * @description Raft consensus replication state machine for distributed storage synchronization.
 */

export type RaftRole = 'FOLLOWER' | 'CANDIDATE' | 'LEADER';

export interface RaftLogEntry {
  readonly term: number;
  readonly index: number;
  readonly command: string;
}

export class RaftStorageReplication {
  private _nodeId: string;
  private _role: RaftRole = 'FOLLOWER';
  private _currentTerm = 0;
  private _votedFor: string | null = null;
  private readonly _log: RaftLogEntry[] = [];
  private _commitIndex = 0;

  constructor(nodeId: string) {
    this._nodeId = nodeId;
  }

  public startElection(): void {
    this._role = 'CANDIDATE';
    this._currentTerm += 1;
    this._votedFor = this._nodeId;
  }

  public becomeLeader(): void {
    this._role = 'LEADER';
  }

  public appendLog(command: string): RaftLogEntry {
    const entry: RaftLogEntry = {
      term: this._currentTerm,
      index: this._log.length + 1,
      command,
    };
    this._log.push(entry);
    return entry;
  }

  public commit(index: number): void {
    if (index <= this._log.length) {
      this._commitIndex = index;
    }
  }

  public get role(): RaftRole {
    return this._role;
  }

  public get term(): number {
    return this._currentTerm;
  }

  public get votedFor(): string | null {
    return this._votedFor;
  }

  public get logLength(): number {
    return this._log.length;
  }

  public get commitIndex(): number {
    return this._commitIndex;
  }
}
