/**
 * WebOS Backend - WebSocket Real-Time Communication Hub
 * Multiplexes terminal streams, presence tracking, broadcast events, and cloud synchronization channels.
 */

export interface WSMessage {
  channel: 'terminal' | 'notifications' | 'presence' | 'sync';
  type: string;
  senderId: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export type WSConnectionHandler = (message: WSMessage) => void;

export class WebSocketHub {
  private static instance: WebSocketHub;
  private connections: Map<string, WSConnectionHandler> = new Map();
  private channelSubscriptions: Map<string, Set<string>> = new Map();

  private constructor() {
    this.channelSubscriptions.set('terminal', new Set());
    this.channelSubscriptions.set('notifications', new Set());
    this.channelSubscriptions.set('presence', new Set());
    this.channelSubscriptions.set('sync', new Set());
  }

  public static getInstance(): WebSocketHub {
    if (!WebSocketHub.instance) {
      WebSocketHub.instance = new WebSocketHub();
    }
    return WebSocketHub.instance;
  }

  public registerClient(clientId: string, handler: WSConnectionHandler) {
    this.connections.set(clientId, handler);
    // Subscribe to default channels
    this.subscribe(clientId, 'notifications');
    this.subscribe(clientId, 'presence');
  }

  public unregisterClient(clientId: string) {
    this.connections.delete(clientId);
    for (const subscribers of this.channelSubscriptions.values()) {
      subscribers.delete(clientId);
    }
  }

  public subscribe(clientId: string, channel: string) {
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)!.add(clientId);
  }

  public unsubscribe(clientId: string, channel: string) {
    this.channelSubscriptions.get(channel)?.delete(clientId);
  }

  public broadcast(channel: 'terminal' | 'notifications' | 'presence' | 'sync', type: string, payload: Record<string, unknown>, senderId: string = 'system') {
    const message: WSMessage = {
      channel,
      type,
      senderId,
      timestamp: Date.now(),
      payload,
    };

    const subscribers = this.channelSubscriptions.get(channel);
    if (subscribers) {
      subscribers.forEach((clientId) => {
        const handler = this.connections.get(clientId);
        if (handler) {
          try {
            handler(message);
          } catch (e) {
            console.error(`WebSocket broadcast error for client ${clientId}:`, e);
          }
        }
      });
    }
  }
}

export const wsHub = WebSocketHub.getInstance();
