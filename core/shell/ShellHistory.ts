/**
 * @file ShellHistory.ts
 * @description Bounded FIFO history manager for shell commands.
 */

export class ShellHistory {
  private readonly _entries: string[] = [];
  private readonly _maxSize: number;

  constructor(maxSize = 100) {
    this._maxSize = Math.max(1, maxSize);
  }

  public add(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Do not add consecutive duplicate commands
    if (this._entries.length > 0 && this._entries[this._entries.length - 1] === trimmed) {
      return;
    }

    this._entries.push(trimmed);
    if (this._entries.length > this._maxSize) {
      this._entries.shift();
    }
  }

  public getHistory(): readonly string[] {
    return [...this._entries];
  }

  public getAt(index: number): string | undefined {
    return this._entries[index];
  }

  public clear(): void {
    this._entries.length = 0;
  }

  public search(prefix: string): readonly string[] {
    const p = prefix.toLowerCase();
    return this._entries.filter((entry) => entry.toLowerCase().startsWith(p));
  }

  public size(): number {
    return this._entries.length;
  }
}
