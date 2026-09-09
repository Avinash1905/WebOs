/**
 * @file VirtioPciController.ts
 * @description VirtIO over PCI device emulation: queue descriptors, available ring, used ring, and MMIO.
 */

export interface VirtQueueDesc {
  addr: number;
  len: number;
  flags: number; // NEXT (1), WRITE (2), INDIRECT (4)
  next: number;
}

export interface VirtQueue {
  readonly queueId: number;
  readonly size: number;
  readonly descriptors: VirtQueueDesc[];
  readonly availRing: number[]; // Descriptor indices
  readonly usedRing: { id: number; len: number }[];
  availIdx: number;
  usedIdx: number;
}

export class VirtioPciController {
  private readonly _queues = new Map<number, VirtQueue>();
  private _deviceStatus = 0; // ACKNOWLEDGE (1), DRIVER (2), DRIVER_OK (4), FEATURES_OK (8)
  private _deviceFeatures = 0x10000000; // Bitmask of negotiated features

  public initQueue(queueId: number, size: number = 128): VirtQueue {
    const descriptors: VirtQueueDesc[] = [];
    for (let i = 0; i < size; i++) {
      descriptors.push({ addr: 0, len: 0, flags: 0, next: 0 });
    }

    const queue: VirtQueue = {
      queueId,
      size,
      descriptors,
      availRing: [],
      usedRing: [],
      availIdx: 0,
      usedIdx: 0,
    };

    this._queues.set(queueId, queue);
    return queue;
  }

  public pushAvailDescriptor(queueId: number, descIndex: number): boolean {
    const q = this._queues.get(queueId);
    if (!q || descIndex >= q.size) return false;
    q.availRing.push(descIndex);
    q.availIdx++;
    return true;
  }

  public popAvailDescriptor(queueId: number): number | null {
    const q = this._queues.get(queueId);
    if (!q || q.availRing.length === 0) return null;
    return q.availRing.shift()!;
  }

  public completeBuffer(queueId: number, descIndex: number, bytesWritten: number): void {
    const q = this._queues.get(queueId);
    if (!q) return;
    q.usedRing.push({ id: descIndex, len: bytesWritten });
    q.usedIdx++;
  }

  public setStatus(status: number): void {
    this._deviceStatus = status;
  }

  public getStatus(): number {
    return this._deviceStatus;
  }

  public get deviceFeatures(): number {
    return this._deviceFeatures;
  }

  public getQueue(queueId: number): VirtQueue | undefined {
    return this._queues.get(queueId);
  }
}
