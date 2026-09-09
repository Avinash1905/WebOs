/**
 * WebOS Two-Phase Locking (2PL) Concurrency Lock Manager & Deadlock Detector
 */

export type LockMode = 'SHARED' | 'EXCLUSIVE';

export interface LockRequest {
  txnId: string;
  resourceId: string;
  mode: LockMode;
  granted: boolean;
}

export class TwoPhaseLockManager {
  private locks: Map<string, LockRequest[]> = new Map(); // Resource -> Requests
  private waitGraph: Map<string, Set<string>> = new Map(); // Txn -> Txns waiting on

  public acquireLock(txnId: string, resourceId: string, mode: LockMode): boolean {
    if (!this.locks.has(resourceId)) {
      this.locks.set(resourceId, []);
    }

    const currentRequests = this.locks.get(resourceId)!;
    const isConflict = currentRequests.some((req) => req.mode === 'EXCLUSIVE' || (mode === 'EXCLUSIVE' && req.granted));

    if (!isConflict) {
      currentRequests.push({ txnId, resourceId, mode, granted: true });
      return true;
    }

    currentRequests.push({ txnId, resourceId, mode, granted: false });
    this.recordWaitDependency(txnId, currentRequests.filter((r) => r.granted).map((r) => r.txnId));
    return false;
  }

  public releaseLocks(txnId: string): void {
    for (const [resId, reqs] of this.locks.entries()) {
      const remaining = reqs.filter((r) => r.txnId !== txnId);
      this.locks.set(resId, remaining);

      // Grant next pending if no conflict
      if (remaining.length > 0 && !remaining[0].granted) {
        remaining[0].granted = true;
      }
    }
    this.waitGraph.delete(txnId);
  }

  private recordWaitDependency(waitingTxn: string, holderTxns: string[]): void {
    if (!this.waitGraph.has(waitingTxn)) this.waitGraph.set(waitingTxn, new Set());
    for (const holder of holderTxns) {
      this.waitGraph.get(waitingTxn)!.add(holder);
    }
  }

  public detectDeadlock(): string | null {
    // DFS cycle check
    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const node of this.waitGraph.keys()) {
      if (this.hasCycle(node, visited, recStack)) {
        return node; // Victim transaction to abort
      }
    }
    return null;
  }

  private hasCycle(node: string, visited: Set<string>, recStack: Set<string>): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = this.waitGraph.get(node);
    if (neighbors) {
      for (const next of neighbors) {
        if (this.hasCycle(next, visited, recStack)) return true;
      }
    }

    recStack.delete(node);
    return false;
  }
}

export const lockManager = new TwoPhaseLockManager();
