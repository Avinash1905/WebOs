/**
 * @file SystemCallTable.ts
 * @description POSIX system call dispatch matrix with user/kernel space translation and errno conversion.
 */

export type SyscallHandler = (args: readonly unknown[], securityContext?: { userId: string; role: string }) => Promise<unknown> | unknown;

export interface SyscallEntry {
  readonly syscallNumber: number;
  readonly name: string;
  readonly argumentCount: number;
  readonly handler: SyscallHandler;
  readonly requiresPrivilege?: boolean;
}

export class SystemCallTable {
  private readonly syscalls = new Map<number, SyscallEntry>();
  private readonly nameIndex = new Map<string, number>();

  public registerSyscall(number: number, name: string, argumentCount: number, handler: SyscallHandler, requiresPrivilege = false): void {
    const entry: SyscallEntry = {
      syscallNumber: number,
      name,
      argumentCount,
      handler,
      requiresPrivilege
    };

    this.syscalls.set(number, entry);
    this.nameIndex.set(name, number);
  }

  public async dispatch(numberOrName: number | string, args: unknown[], securityContext?: { userId: string; role: string }): Promise<unknown> {
    let num: number | undefined;
    if (typeof numberOrName === 'string') {
      num = this.nameIndex.get(numberOrName);
    } else {
      num = numberOrName;
    }

    if (num === undefined || !this.syscalls.has(num)) {
      throw new Error(`ENOSYS: System call ${numberOrName} not implemented`);
    }

    const entry = this.syscalls.get(num)!;

    if (entry.requiresPrivilege && securityContext?.role !== 'ADMIN') {
      throw new Error(`EPERM: Operation not permitted for syscall ${entry.name}`);
    }

    return entry.handler(args, securityContext);
  }

  public getSyscall(number: number): SyscallEntry | undefined {
    return this.syscalls.get(number);
  }

  public listSyscalls(): readonly SyscallEntry[] {
    return Array.from(this.syscalls.values());
  }
}
