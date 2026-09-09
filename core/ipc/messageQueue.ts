/**
 * WebOS Core - POSIX Message Queue (mq_open, mq_send, mq_receive)
 */

import { IPCMessage } from './types';

export class MessageQueue {
  public readonly name: string;
  public readonly maxMessages: number;
  public readonly maxMessageSize: number;

  private queue: IPCMessage[] = [];
  private listeners: Array<(msg: IPCMessage) => void> = [];
  private waiters: Array<(msg: IPCMessage) => void> = [];

  constructor(name: string, maxMessages: number = 128, maxMessageSize: number = 8192) {
    this.name = name;
    this.maxMessages = maxMessages;
    this.maxMessageSize = maxMessageSize;
  }

  public send(senderPid: number, payload: any, priority: number = 0, receiverPid?: number): boolean {
    if (this.queue.length >= this.maxMessages) {
      throw new Error(`EAGAIN: Message queue '${this.name}' is full`);
    }

    const msg: IPCMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderPid,
      receiverPid,
      channel: this.name,
      payload,
      priority,
      timestamp: Date.now(),
    };

    // If there is an active synchronous waiter, fulfill it immediately
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter(msg);
      return true;
    }

    // Insert sorted by priority descending
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (priority > this.queue[i].priority) {
        this.queue.splice(i, 0, msg);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(msg);
    }

    // Notify async listeners
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (e) {
        console.error(`Error in IPC queue listener [${this.name}]:`, e);
      }
    }

    return true;
  }

  public receive(): IPCMessage | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  public async receiveAsync(timeoutMs: number = 5000): Promise<IPCMessage> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(fulfill);
        if (idx !== -1) this.waiters.splice(idx, 1);
        reject(new Error(`ETIMEDOUT: Message queue '${this.name}' receive timeout`));
      }, timeoutMs);

      const fulfill = (msg: IPCMessage) => {
        clearTimeout(timer);
        resolve(msg);
      };

      this.waiters.push(fulfill);
    });
  }

  public subscribe(callback: (msg: IPCMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  public get length(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue = [];
  }
}

export class MessageQueueManager {
  private static instance: MessageQueueManager;
  private queues: Map<string, MessageQueue> = new Map();

  private constructor() {}

  public static getInstance(): MessageQueueManager {
    if (!MessageQueueManager.instance) {
      MessageQueueManager.instance = new MessageQueueManager();
    }
    return MessageQueueManager.instance;
  }

  public openQueue(name: string, maxMessages: number = 128): MessageQueue {
    let q = this.queues.get(name);
    if (!q) {
      q = new MessageQueue(name, maxMessages);
      this.queues.set(name, q);
    }
    return q;
  }

  public closeQueue(name: string): boolean {
    return this.queues.delete(name);
  }

  public listQueues(): string[] {
    return Array.from(this.queues.keys());
  }
}

export const messageQueueManager = MessageQueueManager.getInstance();
