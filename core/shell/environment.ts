/**
 * WebOS Core - Shell Environment & Context
 * Manages shell variables ($PATH, $USER, $HOME, $PWD), alias mapping, and command history.
 */

export class ShellEnvironment {
  private vars: Map<string, string> = new Map();
  private aliases: Map<string, string> = new Map();
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor(initialVars?: Record<string, string>) {
    this.vars.set('PATH', '/bin:/usr/bin:/sbin');
    this.vars.set('USER', 'user');
    this.vars.set('HOME', '/home/user');
    this.vars.set('PWD', '/home/user');
    this.vars.set('SHELL', '/bin/sh');
    this.vars.set('TERM', 'xterm-256color');
    this.vars.set('LANG', 'en_US.UTF-8');

    if (initialVars) {
      for (const [k, v] of Object.entries(initialVars)) {
        this.vars.set(k, v);
      }
    }

    // Default aliases
    this.aliases.set('ll', 'ls -la');
    this.aliases.set('la', 'ls -a');
    this.aliases.set('cls', 'clear');
  }

  public get(key: string): string {
    return this.vars.get(key) ?? '';
  }

  public set(key: string, value: string): void {
    this.vars.set(key, value);
  }

  public delete(key: string): boolean {
    return this.vars.delete(key);
  }

  public getAll(): Record<string, string> {
    return Object.fromEntries(this.vars);
  }

  public get pwd(): string {
    return this.get('PWD') || '/home/user';
  }

  public set pwd(newPath: string) {
    this.set('PWD', newPath);
  }

  public setAlias(name: string, command: string) {
    this.aliases.set(name, command);
  }

  public getAlias(name: string): string | undefined {
    return this.aliases.get(name);
  }

  public getAllAliases(): Record<string, string> {
    return Object.fromEntries(this.aliases);
  }

  public addHistory(cmd: string) {
    const trimmed = cmd.trim();
    if (trimmed && (this.history.length === 0 || this.history[this.history.length - 1] !== trimmed)) {
      this.history.push(trimmed);
    }
    this.historyIndex = this.history.length;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public historyPrev(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex > 0) {
      this.historyIndex--;
    }
    return this.history[this.historyIndex] || null;
  }

  public historyNext(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    this.historyIndex = this.history.length;
    return '';
  }

  /**
   * Expands environment variables ($VAR or ${VAR}) inside a string.
   */
  public expandVariables(text: string): string {
    return text.replace(/\$\{([a-zA-Z0-9_]+)\}|\$([a-zA-Z0-9_]+)/g, (_, braced, plain) => {
      const varName = braced || plain;
      return this.get(varName);
    });
  }
}
