/**
 * WebOS Core - Virtual TCP Socket State Machine & Stream
 */

import { TCPState } from './types';

export class TCPSocket {
  public readonly localPort: number;
  public readonly remotePort: number;
  public readonly remoteAddress: string;
  public state: TCPState = 'CLOSED';

  private dataListeners: Array<(chunk: Uint8Array) => void> = [];
  private closeListeners: Array<() => void> = [];
  private sendBuffer: Uint8Array[] = [];

  constructor(localPort: number, remoteAddress: string, remotePort: number) {
    this.localPort = localPort;
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
  }

  public async connect(): Promise<boolean> {
    this.state = 'SYN_SENT';
    // Simulated 3-way handshake (SYN -> SYN-ACK -> ACK)
    await new Promise((r) => setTimeout(r, 20));
    this.state = 'ESTABLISHED';
    return true;
  }

  public send(data: string | Uint8Array): void {
    if (this.state !== 'ESTABLISHED') {
      throw new Error(`ENOTCONN: TCP socket is in state ${this.state}`);
    }
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.sendBuffer.push(bytes);
  }

  public receive(data: Uint8Array): void {
    if (this.state !== 'ESTABLISHED') return;
    for (const listener of this.dataListeners) {
      try {
        listener(data);
      } catch (e) {
        console.error('TCP socket listener error:', e);
      }
    }
  }

  public onData(listener: (chunk: Uint8Array) => void): () => void {
    this.dataListeners.push(listener);
    return () => {
      const idx = this.dataListeners.indexOf(listener);
      if (idx !== -1) this.dataListeners.splice(idx, 1);
    };
  }

  public close(): void {
    this.state = 'TIME_WAIT';
    for (const listener of this.closeListeners) {
      listener();
    }
    this.state = 'CLOSED';
  }

  public onClose(listener: () => void): void {
    this.closeListeners.push(listener);
  }
}
