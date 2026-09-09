/**
 * WebOS Protocols - MQTT 3.1.1 / 5.0 Pub/Sub Engine
 */

export interface MQTTPacket {
  type: 'CONNECT' | 'CONNACK' | 'PUBLISH' | 'PUBACK' | 'SUBSCRIBE' | 'SUBACK' | 'UNSUBSCRIBE' | 'PINGREQ' | 'PINGRESP' | 'DISCONNECT';
  topic?: string;
  payload?: Uint8Array | string;
  qos?: 0 | 1 | 2;
  packetId?: number;
  retain?: boolean;
}

export class MQTTBroker {
  private subscriptions: Map<string, Set<(topic: string, message: string) => void>> = new Map();
  private retainedMessages: Map<string, string> = new Map();

  public subscribe(topicPattern: string, callback: (topic: string, message: string) => void): () => void {
    if (!this.subscriptions.has(topicPattern)) {
      this.subscriptions.set(topicPattern, new Set());
    }
    this.subscriptions.get(topicPattern)!.add(callback);

    // Deliver retained message if exists
    if (this.retainedMessages.has(topicPattern)) {
      callback(topicPattern, this.retainedMessages.get(topicPattern)!);
    }

    return () => {
      this.subscriptions.get(topicPattern)?.delete(callback);
    };
  }

  public publish(topic: string, message: string, retain: boolean = false): void {
    if (retain) {
      this.retainedMessages.set(topic, message);
    }

    for (const [pattern, listeners] of this.subscriptions.entries()) {
      if (this.matchTopic(pattern, topic)) {
        for (const listener of listeners) {
          try {
            listener(topic, message);
          } catch (e) {
            console.error(`MQTT listener error on topic ${topic}:`, e);
          }
        }
      }
    }
  }

  private matchTopic(pattern: string, topic: string): boolean {
    if (pattern === '#' || pattern === topic) return true;
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') return true;
      if (patternParts[i] === '+') continue;
      if (patternParts[i] !== topicParts[i]) return false;
    }
    return patternParts.length === topicParts.length;
  }
}

export const mqttBroker = new MQTTBroker();
