/**
 * WebOS Backend Enterprise - Distributed Event Streaming & Log Partitioning Broker (Kafka-equivalent)
 */

export interface EventRecord<T = any> {
  topic: string;
  partition: number;
  offset: number;
  key?: string;
  value: T;
  timestamp: number;
  headers?: Record<string, string>;
}

export class EventStreamBroker {
  private static instance: EventStreamBroker;
  private partitions: Map<string, EventRecord[][]> = new Map(); // topic -> partition[] -> records
  private consumerGroupOffsets: Map<string, Map<string, number>> = new Map(); // group:topic -> partition -> offset

  private constructor() {
    this.createTopic('webos.system.events', 3);
    this.createTopic('webos.vfs.mutations', 4);
    this.createTopic('webos.auth.telemetry', 2);
  }

  public static getInstance(): EventStreamBroker {
    if (!EventStreamBroker.instance) {
      EventStreamBroker.instance = new EventStreamBroker();
    }
    return EventStreamBroker.instance;
  }

  public createTopic(topic: string, partitionCount: number = 1): void {
    if (!this.partitions.has(topic)) {
      const partList: EventRecord[][] = [];
      for (let i = 0; i < partitionCount; i++) {
        partList.push([]);
      }
      this.partitions.set(topic, partList);
    }
  }

  public produce<T = any>(topic: string, value: T, key?: string): EventRecord<T> {
    let partList = this.partitions.get(topic);
    if (!partList) {
      this.createTopic(topic, 1);
      partList = this.partitions.get(topic)!;
    }

    const partition = key ? Math.abs(this.hashCode(key)) % partList.length : 0;
    const targetPartition = partList[partition];
    const offset = targetPartition.length;

    const record: EventRecord<T> = {
      topic,
      partition,
      offset,
      key,
      value,
      timestamp: Date.now(),
    };

    targetPartition.push(record);
    return record;
  }

  public consume(consumerGroup: string, topic: string, maxBatchSize: number = 100): EventRecord[] {
    const partList = this.partitions.get(topic);
    if (!partList) return [];

    const groupKey = `${consumerGroup}:${topic}`;
    let offsets = this.consumerGroupOffsets.get(groupKey);
    if (!offsets) {
      offsets = new Map();
      this.consumerGroupOffsets.set(groupKey, offsets);
    }

    const results: EventRecord[] = [];
    for (let p = 0; p < partList.length; p++) {
      const currentOffset = offsets.get(String(p)) || 0;
      const partitionRecords = partList[p];
      const recordsToRead = partitionRecords.slice(currentOffset, currentOffset + maxBatchSize);
      results.push(...recordsToRead);
      offsets.set(String(p), currentOffset + recordsToRead.length);
    }

    return results;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const eventStreamBroker = EventStreamBroker.getInstance();
