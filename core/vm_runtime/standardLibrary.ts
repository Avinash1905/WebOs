/**
 * WebOS Standard Library Module Ecosystem
 */

export namespace StdCollections {
  export class RingBuffer<T> {
    private buffer: (T | undefined)[];
    private head = 0;
    private tail = 0;
    private count = 0;

    constructor(public readonly capacity: number) {
      this.buffer = new Array(capacity);
    }

    public push(item: T): boolean {
      if (this.count >= this.capacity) return false;
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      this.count++;
      return true;
    }

    public pop(): T | undefined {
      if (this.count === 0) return undefined;
      const item = this.buffer[this.head];
      this.buffer[this.head] = undefined;
      this.head = (this.head + 1) % this.capacity;
      this.count--;
      return item;
    }

    public size(): number {
      return this.count;
    }
  }

  export class PriorityQueue<T> {
    private items: { item: T; priority: number }[] = [];

    public enqueue(item: T, priority: number): void {
      this.items.push({ item, priority });
      this.items.sort((a, b) => b.priority - a.priority);
    }

    public dequeue(): T | undefined {
      return this.items.shift()?.item;
    }

    public peek(): T | undefined {
      return this.items[0]?.item;
    }

    public size(): number {
      return this.items.length;
    }
  }
}

export namespace StdMath {
  export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * clamp(t, 0, 1);
  }

  export function smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  export function degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180.0;
  }

  export function radToDeg(radians: number): number {
    return (radians * 180.0) / Math.PI;
  }
}

export namespace StdIO {
  export class TextStreamWriter {
    private chunks: string[] = [];

    public write(str: string): void {
      this.chunks.push(str);
    }

    public writeLine(str: string): void {
      this.chunks.push(str + '\n');
    }

    public toString(): string {
      return this.chunks.join('');
    }

    public clear(): void {
      this.chunks = [];
    }
  }
}

export * from './jitCompiler';
export * from './garbageCollector';
