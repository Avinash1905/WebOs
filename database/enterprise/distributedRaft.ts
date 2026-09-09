/**
 * WebOS Raft Distributed Consensus Protocol Engine
 */

export type RaftRole = 'Leader' | 'Follower' | 'Candidate';

export interface RaftLogEntry {
  term: number;
  index: number;
  command: string;
  data: any;
}

export class RaftNode {
  public currentTerm = 1;
  public votedFor: string | null = null;
  public role: RaftRole = 'Follower';
  public log: RaftLogEntry[] = [];
  public commitIndex = 0;
  public lastApplied = 0;

  constructor(public readonly nodeId: string, public readonly clusterPeers: string[]) {}

  public requestVote(candidateTerm: number, candidateId: string, lastLogIndex: number, lastLogTerm: number): boolean {
    if (candidateTerm > this.currentTerm) {
      this.currentTerm = candidateTerm;
      this.role = 'Follower';
      this.votedFor = null;
    }

    if (candidateTerm === this.currentTerm && (this.votedFor === null || this.votedFor === candidateId)) {
      const myLastTerm = this.log.length > 0 ? this.log[this.log.length - 1].term : 0;
      if (lastLogTerm >= myLastTerm && lastLogIndex >= this.log.length) {
        this.votedFor = candidateId;
        return true;
      }
    }

    return false;
  }

  public appendEntries(term: number, leaderId: string, entries: RaftLogEntry[], leaderCommit: number): boolean {
    if (term < this.currentTerm) return false;

    this.currentTerm = term;
    this.role = 'Follower';

    for (const entry of entries) {
      this.log.push(entry);
    }

    if (leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(leaderCommit, this.log.length);
    }

    return true;
  }

  public becomeLeader(): void {
    this.role = 'Leader';
  }

  public getStats() {
    return {
      nodeId: this.nodeId,
      role: this.role,
      currentTerm: this.currentTerm,
      logLength: this.log.length,
      commitIndex: this.commitIndex,
    };
  }
}
