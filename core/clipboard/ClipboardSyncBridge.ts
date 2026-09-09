/**
 * @file ClipboardSyncBridge.ts
 * @description Cross-window / cross-iframe asynchronous broadcast synchronization for clipboard events.
 */

export interface ClipboardSyncMessage {
  readonly sequence: number;
  readonly senderId: string;
  readonly mimeType: string;
  readonly payload: string;
  readonly timestamp: number;
}

export class ClipboardSyncBridge {
  private _sequence = 0;
  private readonly _localSenderId: string;
  private readonly _listeners: ((msg: ClipboardSyncMessage) => void)[] = [];

  constructor(senderId?: string) {
    this._localSenderId = senderId ?? `win_${Math.random().toString(36).substring(2, 9)}`;
  }

  public broadcast(mimeType: string, payload: string): ClipboardSyncMessage {
    const msg: ClipboardSyncMessage = {
      sequence: ++this._sequence,
      senderId: this._localSenderId,
      mimeType,
      payload,
      timestamp: Date.now(),
    };

    for (const listener of this._listeners) {
      try {
        listener(msg);
      } catch {
        // Ignore listener error
      }
    }

    return msg;
  }

  public onSync(listener: (msg: ClipboardSyncMessage) => void): () => void {
    this._listeners.push(listener);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  public get senderId(): string {
    return this._localSenderId;
  }

  public get sequence(): number {
    return this._sequence;
  }
}
