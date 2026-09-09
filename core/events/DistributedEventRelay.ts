/**
 * @file DistributedEventRelay.ts
 * @description Cross-context BroadcastChannel event replication with causal vector clocks.
 */

export interface VectorClock {
  readonly nodeId: string;
  readonly counter: number;
}

export interface ReplicatedEventPacket {
  readonly eventType: string;
  readonly payload: unknown;
  readonly originNodeId: string;
  readonly vectorClock: VectorClock;
  readonly timestamp: number;
}

export class DistributedEventRelay {
  private localCounter = 0;
  private readonly seenPackets = new Set<string>();

  constructor(public readonly nodeId: string) {}

  public packageEvent(eventType: string, payload: unknown): ReplicatedEventPacket {
    this.localCounter++;
    const packet: ReplicatedEventPacket = {
      eventType,
      payload,
      originNodeId: this.nodeId,
      vectorClock: { nodeId: this.nodeId, counter: this.localCounter },
      timestamp: Date.now()
    };
    this.seenPackets.add(`${this.nodeId}:${this.localCounter}`);
    return packet;
  }

  public receivePacket(packet: ReplicatedEventPacket): { isNew: boolean; payload: unknown } {
    const key = `${packet.originNodeId}:${packet.vectorClock.counter}`;
    if (this.seenPackets.has(key)) {
      return { isNew: false, payload: packet.payload };
    }

    this.seenPackets.add(key);
    return { isNew: true, payload: packet.payload };
  }
}
