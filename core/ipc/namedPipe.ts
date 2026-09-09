/**
 * WebOS Core - Named Pipe / FIFO Subsystem (mkfifo)
 */

export class NamedPipe {
  public readonly path: string;
  private buffer: Uint8Array[] = [];
  private readers: Array<(chunk: Uint8Array) => void> = [];
  private closed: boolean = false;

  constructor(path: string) {
    this.path = path;
  }

  public write(chunk: Uint8Array | string): void {
    if (this.closed) throw new Error('EPIPE: Broken pipe');
    const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;

    if (this.readers.length > 0) {
      const reader = this.readers.shift()!;
      reader(bytes);
    } else {
      this.buffer.push(bytes);
    }
  }

  public async read(): Promise<Uint8Array | null> {
    if (this.buffer.length > 0) {
      return this.buffer.shift()!;
    }
    if (this.closed) return null;

    return new Promise((resolve) => {
      this.readers.push((chunk) => {
        resolve(chunk);
      });
    });
  }

  public close(): void {
    this.closed = true;
    for (const reader of this.readers) {
      reader(new Uint8Array(0));
    }
    this.readers = [];
  }
}

export class NamedPipeManager {
  private static instance: NamedPipeManager;
  private pipes: Map<string, NamedPipe> = new Map();

  private constructor() {}

  public static getInstance(): NamedPipeManager {
    if (!NamedPipeManager.instance) {
      NamedPipeManager.instance = new NamedPipeManager();
    }
    return NamedPipeManager.instance;
  }

  public mkfifo(path: string): NamedPipe {
    if (this.pipes.has(path)) {
      throw new Error(`EEXIST: FIFO '${path}' already exists`);
    }
    const pipe = new NamedPipe(path);
    this.pipes.set(path, pipe);
    return pipe;
  }

  public getPipe(path: string): NamedPipe | undefined {
    return this.pipes.get(path);
  }

  public removePipe(path: string): boolean {
    const p = this.pipes.get(path);
    if (p) {
      p.close();
      return this.pipes.delete(path);
    }
    return false;
  }
}

export const namedPipeManager = NamedPipeManager.getInstance();
