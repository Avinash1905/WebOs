/**
 * @file KernelTrapTable.ts
 * @description CPU trap/interrupt descriptor table: PageFault, DivisionByZero, GeneralProtection fault handlers.
 */

export interface TrapFrame {
  readonly vector: number;
  readonly trapName: string;
  readonly errorCode: number;
  readonly rip: number; // Instruction pointer
  readonly rsp: number; // Stack pointer
  readonly cr2?: number; // Faulting virtual address for #PF
}

export class KernelTrapTable {
  private readonly _handlers = new Map<number, (frame: TrapFrame) => void>();
  private readonly _trapHistory: TrapFrame[] = [];

  constructor() {
    this.initDefaultTraps();
  }

  public registerTrapHandler(vector: number, handler: (frame: TrapFrame) => void): void {
    this._handlers.set(vector, handler);
  }

  public dispatchTrap(frame: TrapFrame): boolean {
    this._trapHistory.push(frame);
    const handler = this._handlers.get(frame.vector);
    if (handler) {
      handler(frame);
      return true;
    }
    return false;
  }

  public getHistory(): readonly TrapFrame[] {
    return this._trapHistory;
  }

  private initDefaultTraps(): void {
    // 0: #DE Divide by Zero
    this.registerTrapHandler(0, (_f) => {
      // Default handler
    });
    // 13: #GP General Protection Fault
    this.registerTrapHandler(13, (_f) => {
      // GP handler
    });
    // 14: #PF Page Fault
    this.registerTrapHandler(14, (_f) => {
      // PF handler
    });
  }
}
