/**
 * @file VirtualIPC.ts
 * @description Virtual Inter-Process Communication (IPC) pipes and message queues.
 */

export interface IPCPipe {
  readonly pipeId: string;
  readonly name?: string;
  readonly readerPid?: number;
  readonly writerPid?: number;
  readonly capacity: number;
}

export type IPCMessageCallback = (msg: unknown, fromPid: number) => void;

export class VirtualIPC {
  private readonly pipes = new Map<string, { desc: IPCPipe; buffer: Uint8Array; writePos: number }>();
  private readonly messageQueues = new Map<string, { messages: Array<{ fromPid: number; payload: unknown; timestamp: number }>; subscribers: Set<IPCMessageCallback> }>();

  public createPipe(pipeId: string, options?: { name?: string; readerPid?: number; writerPid?: number; capacity?: number }): IPCPipe {
    const capacity = options?.capacity ?? 65536;
    const desc: IPCPipe = {
      pipeId,
      name: options?.name,
      readerPid: options?.readerPid,
      writerPid: options?.writerPid,
      capacity
    };

    this.pipes.set(pipeId, {
      desc,
      buffer: new Uint8Array(capacity),
      writePos: 0
    });

    return desc;
  }

  public writePipe(pipeId: string, data: Uint8Array): number {
    const pipe = this.pipes.get(pipeId);
    if (!pipe) throw new Error(`Pipe ${pipeId} not found`);

    const available = pipe.desc.capacity - pipe.writePos;
    const toWrite = Math.min(available, data.length);

    pipe.buffer.set(data.subarray(0, toWrite), pipe.writePos);
    pipe.writePos += toWrite;
    return toWrite;
  }

  public readPipe(pipeId: string, maxBytes = 4096): Uint8Array {
    const pipe = this.pipes.get(pipeId);
    if (!pipe || pipe.writePos === 0) return new Uint8Array(0);

    const toRead = Math.min(pipe.writePos, maxBytes);
    const result = pipe.buffer.slice(0, toRead);

    // Shift buffer contents
    if (toRead < pipe.writePos) {
      pipe.buffer.copyWithin(0, toRead, pipe.writePos);
      pipe.writePos -= toRead;
    } else {
      pipe.writePos = 0;
    }

    return result;
  }

  public closePipe(pipeId: string): boolean {
    return this.pipes.delete(pipeId);
  }

  public createQueue(queueName: string): void {
    if (!this.messageQueues.has(queueName)) {
      this.messageQueues.set(queueName, { messages: [], subscribers: new Set() });
    }
  }

  public sendMessage(queueName: string, fromPid: number, payload: unknown): void {
    let q = this.messageQueues.get(queueName);
    if (!q) {
      this.createQueue(queueName);
      q = this.messageQueues.get(queueName)!;
    }

    const msg = { fromPid, payload, timestamp: Date.now() };
    q.messages.push(msg);

    for (const sub of q.subscribers) {
      try {
        sub(payload, fromPid);
      } catch {
        // Callback error ignored
      }
    }
  }

  public receiveMessage(queueName: string): { fromPid: number; payload: unknown; timestamp: number } | undefined {
    const q = this.messageQueues.get(queueName);
    return q?.messages.shift();
  }

  public subscribeQueue(queueName: string, callback: IPCMessageCallback): () => void {
    let q = this.messageQueues.get(queueName);
    if (!q) {
      this.createQueue(queueName);
      q = this.messageQueues.get(queueName)!;
    }

    q.subscribers.add(callback);
    return () => q.subscribers.delete(callback);
  }

  public clear(): void {
    this.pipes.clear();
    this.messageQueues.clear();
  }
}
