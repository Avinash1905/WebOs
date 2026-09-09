/**
 * @file KafkaStyleTopicPartition.ts
 * @description Log-structured event partitions with byte offsets and consumer group offset management.
 */

export interface PartitionRecord {
  readonly offset: number;
  readonly key: string;
  readonly value: string;
  readonly timestamp: number;
  readonly headers?: Record<string, string>;
}

export class KafkaStyleTopicPartition {
  private readonly _topic: string;
  private readonly _partitionId: number;
  private readonly _records: PartitionRecord[] = [];
  private readonly _consumerOffsets = new Map<string, number>(); // groupId -> committedOffset

  constructor(topic: string, partitionId: number = 0) {
    this._topic = topic;
    this._partitionId = partitionId;
  }

  public append(key: string, value: string, headers?: Record<string, string>): number {
    const offset = this._records.length;
    this._records.push({
      offset,
      key,
      value,
      timestamp: Date.now(),
      headers,
    });
    return offset;
  }

  public readFrom(offset: number, maxCount: number = 50): PartitionRecord[] {
    return this._records.slice(offset, offset + maxCount);
  }

  public commitOffset(groupId: string, offset: number): void {
    this._consumerOffsets.set(groupId, offset);
  }

  public getCommittedOffset(groupId: string): number {
    return this._consumerOffsets.get(groupId) ?? 0;
  }

  public get topic(): string {
    return this._topic;
  }

  public get partitionId(): number {
    return this._partitionId;
  }

  public get highWatermark(): number {
    return this._records.length;
  }
}
