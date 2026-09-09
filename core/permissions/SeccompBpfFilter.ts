/**
 * @file SeccompBpfFilter.ts
 * @description Secure Computing Mode (seccomp) BPF filter simulation for system call interception.
 */

export type SeccompAction = 'ALLOW' | 'KILL_PROCESS' | 'ERRNO' | 'LOG';

export interface BpfInstruction {
  readonly code: number; // e.g. BPF_LD, BPF_JEQ, BPF_RET
  readonly jt: number;   // Jump true
  readonly jf: number;   // Jump false
  readonly k: number;    // Constant / syscall number
}

export class SeccompBpfFilter {
  private readonly _allowedSyscalls = new Set<number>();
  private _defaultAction: SeccompAction = 'KILL_PROCESS';

  public allowSyscall(syscallNumber: number): void {
    this._allowedSyscalls.add(syscallNumber);
  }

  public setDefaultAction(action: SeccompAction): void {
    this._defaultAction = action;
  }

  public evaluateSyscall(syscallNumber: number): SeccompAction {
    if (this._allowedSyscalls.has(syscallNumber)) {
      return 'ALLOW';
    }
    return this._defaultAction;
  }
}
