/**
 * WebOS Core - Unix Domain Sockets (AF_UNIX)
 */

import { SocketConnection } from './types';

export class UnixServer {
  public readonly socketPath: string;
  private connections: Map<string, SocketConnection> = new Map();
  private onConnectionCallback?: (conn: SocketConnection) => void;

  constructor(socketPath: string) {
    this.socketPath = socketPath;
  }

  public onConnection(cb: (conn: SocketConnection) => void): void {
    this.onConnectionCallback = cb;
  }

  public registerClient(clientPid: number, onData?: (data: Uint8Array) => void): SocketConnection {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const conn: SocketConnection = {
      id,
      socketPath: this.socketPath,
      clientPid,
      connected: true,
      onData,
    };
    this.connections.set(id, conn);

    if (this.onConnectionCallback) {
      this.onConnectionCallback(conn);
    }
    return conn;
  }

  public broadcast(data: Uint8Array): void {
    for (const conn of this.connections.values()) {
      if (conn.connected && conn.onData) {
        conn.onData(data);
      }
    }
  }

  public close(): void {
    for (const conn of this.connections.values()) {
      conn.connected = false;
      if (conn.onClose) conn.onClose();
    }
    this.connections.clear();
  }
}

export class UnixSocketManager {
  private static instance: UnixSocketManager;
  private servers: Map<string, UnixServer> = new Map();

  private constructor() {}

  public static getInstance(): UnixSocketManager {
    if (!UnixSocketManager.instance) {
      UnixSocketManager.instance = new UnixSocketManager();
    }
    return UnixSocketManager.instance;
  }

  public listen(socketPath: string): UnixServer {
    if (this.servers.has(socketPath)) {
      throw new Error(`EADDRINUSE: Unix socket '${socketPath}' is already in use`);
    }
    const server = new UnixServer(socketPath);
    this.servers.set(socketPath, server);
    return server;
  }

  public connect(socketPath: string, clientPid: number, onData?: (data: Uint8Array) => void): SocketConnection {
    const server = this.servers.get(socketPath);
    if (!server) {
      throw new Error(`ECONNREFUSED: No server listening on '${socketPath}'`);
    }
    return server.registerClient(clientPid, onData);
  }

  public closeServer(socketPath: string): boolean {
    const s = this.servers.get(socketPath);
    if (s) {
      s.close();
      return this.servers.delete(socketPath);
    }
    return false;
  }
}

export const unixSocketManager = UnixSocketManager.getInstance();
