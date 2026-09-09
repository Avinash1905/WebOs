/**
 * @file ReadlinePromptEngine.ts
 * @description GNU Readline terminal line editor: cursor navigation, history recall and tab auto-complete.
 */

export class ReadlinePromptEngine {
  private _buffer = '';
  private _cursorPos = 0;
  private readonly _history: string[] = [];
  private _historyIdx = -1;

  public insertChar(char: string): void {
    this._buffer = this._buffer.slice(0, this._cursorPos) + char + this._buffer.slice(this._cursorPos);
    this._cursorPos += char.length;
  }

  public deleteBackward(): void {
    if (this._cursorPos > 0) {
      this._buffer = this._buffer.slice(0, this._cursorPos - 1) + this._buffer.slice(this._cursorPos);
      this._cursorPos -= 1;
    }
  }

  public commitLine(): string {
    const line = this._buffer;
    if (line.trim()) {
      this._history.push(line);
    }
    this._buffer = '';
    this._cursorPos = 0;
    this._historyIdx = this._history.length;
    return line;
  }

  public historyPrevious(): string {
    if (this._history.length === 0) return this._buffer;
    if (this._historyIdx > 0) {
      this._historyIdx--;
    }
    this._buffer = this._history[this._historyIdx] || '';
    this._cursorPos = this._buffer.length;
    return this._buffer;
  }

  public get buffer(): string {
    return this._buffer;
  }

  public get cursor(): number {
    return this._cursorPos;
  }
}
