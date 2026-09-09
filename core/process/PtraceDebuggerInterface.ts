/**
 * @file PtraceDebuggerInterface.ts
 * @description POSIX ptrace process tracing and debugging interface simulation.
 */

export type PtraceRequest = 'PTRACE_ATTACH' | 'PTRACE_DETACH' | 'PTRACE_PEEKTEXT' | 'PTRACE_POKETEXT' | 'PTRACE_SINGLESTEP';

export class PtraceDebuggerInterface {
  private readonly _tracedProcesses = new Map<number, { tracerPid: number; memory: Map<number, number> }>();

  public attach(tracerPid: number, traceePid: number): boolean {
    if (this._tracedProcesses.has(traceePid)) return false;
    this._tracedProcesses.set(traceePid, { tracerPid, memory: new Map() });
    return true;
  }

  public detach(traceePid: number): boolean {
    return this._tracedProcesses.delete(traceePid);
  }

  public peekText(traceePid: number, addr: number): number | null {
    const trace = this._tracedProcesses.get(traceePid);
    if (!trace) return null;
    return trace.memory.get(addr) ?? 0;
  }

  public pokeText(traceePid: number, addr: number, value: number): boolean {
    const trace = this._tracedProcesses.get(traceePid);
    if (!trace) return false;
    trace.memory.set(addr, value);
    return true;
  }

  public isTraced(traceePid: number): boolean {
    return this._tracedProcesses.has(traceePid);
  }
}
