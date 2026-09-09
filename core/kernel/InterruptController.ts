/**
 * @file InterruptController.ts
 * @description Virtual Interrupt Request (IRQ) controller routing hardware and software signals.
 */

export type IRQPriority = 'REALTIME' | 'HIGH' | 'NORMAL' | 'LOW';

export interface IRQVector {
  readonly irqNumber: number;
  readonly name: string;
  readonly priority: IRQPriority;
  readonly handler: (irq: number, context?: unknown) => Promise<void> | void;
  isMasked: boolean;
  triggerCount: number;
}

export class InterruptController {
  private readonly vectors = new Map<number, IRQVector>();
  private readonly pendingIRQs: Array<{ irq: number; context?: unknown; timestamp: number }> = [];
  private isProcessing = false;

  public registerIRQ(irqNumber: number, name: string, priority: IRQPriority, handler: (irq: number, context?: unknown) => Promise<void> | void): void {
    if (this.vectors.has(irqNumber)) {
      throw new Error(`IRQ ${irqNumber} already registered`);
    }

    this.vectors.set(irqNumber, {
      irqNumber,
      name,
      priority,
      handler,
      isMasked: false,
      triggerCount: 0
    });
  }

  public maskIRQ(irqNumber: number): void {
    const vec = this.vectors.get(irqNumber);
    if (vec) vec.isMasked = true;
  }

  public unmaskIRQ(irqNumber: number): void {
    const vec = this.vectors.get(irqNumber);
    if (vec) {
      vec.isMasked = false;
      this.processPending();
    }
  }

  public triggerIRQ(irqNumber: number, context?: unknown): boolean {
    const vec = this.vectors.get(irqNumber);
    if (!vec) return false;

    vec.triggerCount++;

    if (vec.isMasked) {
      this.pendingIRQs.push({ irq: irqNumber, context, timestamp: Date.now() });
      return false;
    }

    if (vec.priority === 'REALTIME') {
      // Execute synchronously
      try {
        vec.handler(irqNumber, context);
      } catch (err) {
        console.error(`IRQ ${irqNumber} realtime handler failed:`, err);
      }
      return true;
    }

    this.pendingIRQs.push({ irq: irqNumber, context, timestamp: Date.now() });
    this.processPending();
    return true;
  }

  public async processPending(): Promise<number> {
    if (this.isProcessing || this.pendingIRQs.length === 0) return 0;
    this.isProcessing = true;
    let handled = 0;

    try {
      while (this.pendingIRQs.length > 0) {
        const item = this.pendingIRQs.shift();
        if (!item) break;

        const vec = this.vectors.get(item.irq);
        if (vec && !vec.isMasked) {
          await Promise.resolve(vec.handler(item.irq, item.context));
          handled++;
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return handled;
  }

  public getStats(): readonly { irq: number; name: string; priority: IRQPriority; masked: boolean; count: number }[] {
    return Array.from(this.vectors.values()).map(v => ({
      irq: v.irqNumber,
      name: v.name,
      priority: v.priority,
      masked: v.isMasked,
      count: v.triggerCount
    }));
  }
}
