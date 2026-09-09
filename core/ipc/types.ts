/**
 * WebOS Core - IPC Type Definitions
 */

export type IPCTransferMode = 'stream' | 'datagram' | 'shared_memory';

export interface IPCMessage<T = any> {
  id: string;
  senderPid: number;
  receiverPid?: number;
  channel: string;
  payload: T;
  priority: number;
  timestamp: number;
}

export interface SharedMemorySegment {
  name: string;
  size: number;
  buffer: ArrayBuffer;
  ownerPid: number;
  attachedPids: Set<number>;
  readOnly: boolean;
}

export interface SocketConnection {
  id: string;
  socketPath: string;
  clientPid: number;
  connected: boolean;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;
}
