/**
 * @file EventPriorityQueue.ts
 * @description Binary heap priority queue ensuring critical system events preempt standard events.
 */

export interface PriorityEvent {
  readonly priority: number; // 0 = highest (PANIC, IRQ), 10 = standard
  readonly eventType: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export class EventPriorityQueue {
  private readonly heap: PriorityEvent[] = [];

  public enqueue(eventType: string, payload: unknown, priority = 10): void {
    const event: PriorityEvent = {
      priority,
      eventType,
      payload,
      timestamp: Date.now()
    };

    this.heap.push(event);
    this.heapifyUp(this.heap.length - 1);
  }

  public dequeue(): PriorityEvent | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const top = this.heap[0];
    const last = this.heap.pop()!;
    this.heap[0] = last;
    this.heapifyDown(0);
    return top;
  }

  public size(): number {
    return this.heap.length;
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const curr = this.heap[index];
      const parent = this.heap[parentIdx];
      if (curr && parent && curr.priority < parent.priority) {
        this.heap[index] = parent;
        this.heap[parentIdx] = curr;
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  private heapifyDown(index: number): void {
    const len = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      const curr = this.heap[smallest];
      const leftChild = this.heap[left];
      const rightChild = this.heap[right];

      if (left < len && leftChild && curr && leftChild.priority < curr.priority) {
        smallest = left;
      }
      const smallestChild = this.heap[smallest];
      if (right < len && rightChild && smallestChild && rightChild.priority < smallestChild.priority) {
        smallest = right;
      }

      if (smallest !== index) {
        const temp = this.heap[index]!;
        this.heap[index] = this.heap[smallest]!;
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}
