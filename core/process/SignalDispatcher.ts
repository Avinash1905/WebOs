/**
 * @file SignalDispatcher.ts
 * @description POSIX Signal System for WebOS Processes.
 */

export type SignalType =
  | 'SIGHUP'
  | 'SIGINT'
  | 'SIGQUIT'
  | 'SIGKILL'
  | 'SIGUSR1'
  | 'SIGUSR2'
  | 'SIGPIPE'
  | 'SIGALRM'
  | 'SIGTERM'
  | 'SIGSTOP'
  | 'SIGCONT'
  | 'SIGCHLD';

export type SignalHandler = (signal: SignalType, senderPid?: number) => void;

export interface ProcessSignalRegistration {
  readonly pid: number;
  readonly handlers: Map<SignalType, SignalHandler>;
  readonly maskedSignals: Set<SignalType>;
  readonly pendingSignals: SignalType[];
}

export class SignalDispatcher {
  private readonly processRegistrations = new Map<number, ProcessSignalRegistration>();

  public registerProcess(pid: number): void {
    if (!this.processRegistrations.has(pid)) {
      this.processRegistrations.set(pid, {
        pid,
        handlers: new Map(),
        maskedSignals: new Set(),
        pendingSignals: []
      });
    }
  }

  public unregisterProcess(pid: number): void {
    this.processRegistrations.delete(pid);
  }

  public installHandler(pid: number, signal: SignalType, handler: SignalHandler): void {
    if (signal === 'SIGKILL' || signal === 'SIGSTOP') {
      throw new Error(`Cannot override handler for uncatchable signal ${signal}`);
    }

    this.registerProcess(pid);
    this.processRegistrations.get(pid)!.handlers.set(signal, handler);
  }

  public maskSignal(pid: number, signal: SignalType): void {
    if (signal === 'SIGKILL' || signal === 'SIGSTOP') return;
    this.registerProcess(pid);
    this.processRegistrations.get(pid)!.maskedSignals.add(signal);
  }

  public unmaskSignal(pid: number, signal: SignalType): void {
    const reg = this.processRegistrations.get(pid);
    if (!reg) return;
    reg.maskedSignals.delete(signal);

    // Deliver any pending unmasked signals
    const pending = [...reg.pendingSignals];
    reg.pendingSignals.length = 0;
    for (const sig of pending) {
      this.dispatch(pid, sig);
    }
  }

  public dispatch(targetPid: number, signal: SignalType, senderPid = 0): { delivered: boolean; action: 'HANDLED' | 'DEFAULT' | 'MASKED' | 'UNREGISTERED' } {
    const reg = this.processRegistrations.get(targetPid);
    if (!reg) {
      return { delivered: false, action: 'UNREGISTERED' };
    }

    if (reg.maskedSignals.has(signal) && signal !== 'SIGKILL' && signal !== 'SIGSTOP') {
      reg.pendingSignals.push(signal);
      return { delivered: false, action: 'MASKED' };
    }

    const customHandler = reg.handlers.get(signal);
    if (customHandler) {
      try {
        customHandler(signal, senderPid);
        return { delivered: true, action: 'HANDLED' };
      } catch {
        return { delivered: false, action: 'HANDLED' };
      }
    }

    return { delivered: true, action: 'DEFAULT' };
  }
}
