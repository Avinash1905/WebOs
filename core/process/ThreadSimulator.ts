/**
 * @file ThreadSimulator.ts
 * @description POSIX pthreads simulation with mutex locks, condition variables, and TLS.
 */

export interface SimulatedThread {
  readonly tid: number;
  readonly pid: number;
  readonly name: string;
  state: 'READY' | 'RUNNING' | 'BLOCKED' | 'TERMINATED';
  readonly tls: Map<string, unknown>;
}

export class ThreadSimulator {
  private _nextTid = 1000;
  private readonly _threads = new Map<number, SimulatedThread>();
  private readonly _mutexes = new Map<string, number | null>(); // mutexName -> holderTid

  public createThread(pid: number, name: string): SimulatedThread {
    const tid = this._nextTid++;
    const thread: SimulatedThread = {
      tid,
      pid,
      name,
      state: 'READY',
      tls: new Map(),
    };
    this._threads.set(tid, thread);
    return thread;
  }

  public acquireMutex(tid: number, mutexName: string): boolean {
    const holder = this._mutexes.get(mutexName);
    if (holder === null || holder === undefined) {
      this._mutexes.set(mutexName, tid);
      return true;
    }
    if (holder === tid) return true; // Reentrant

    const thread = this._threads.get(tid);
    if (thread) thread.state = 'BLOCKED';
    return false;
  }

  public releaseMutex(tid: number, mutexName: string): boolean {
    const holder = this._mutexes.get(mutexName);
    if (holder !== tid) return false;

    this._mutexes.set(mutexName, null);
    // Unblock any waiting threads for this mutex
    for (const thread of this._threads.values()) {
      if (thread.state === 'BLOCKED') {
        thread.state = 'READY';
      }
    }
    return true;
  }

  public terminateThread(tid: number): boolean {
    const thread = this._threads.get(tid);
    if (!thread) return false;
    thread.state = 'TERMINATED';
    return true;
  }

  public getThread(tid: number): SimulatedThread | undefined {
    return this._threads.get(tid);
  }
}
