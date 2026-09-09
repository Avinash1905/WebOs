/**
 * @file ShellSession.ts
 * @description Manages a stateful user shell session with CWD, environment, and history.
 */

import { CommandContextFactory } from './CommandContext.js';
import { CommandExecutor } from './CommandExecutor.js';
import { Environment } from './Environment.js';
import type { Shell } from './Shell.js';
import { ShellHistory } from './ShellHistory.js';
import type { CommandResult, ShellSessionConfig } from './types.js';

let sessionCounter = 0;

export class ShellSession {
  public readonly sessionId: string;
  public readonly userId: string;

  private _cwd: string;
  private readonly _env: Environment;
  private readonly _history: ShellHistory;
  private _shell: Shell | null = null;

  constructor(config?: ShellSessionConfig, shell?: Shell) {
    this.sessionId = config?.sessionId ?? `sh_${Date.now()}_${++sessionCounter}`;
    this.userId = config?.userId ?? 'user';
    this._cwd = config?.initialCwd ?? '/';
    this._shell = shell ?? null;

    this._env = new Environment({
      USER: this.userId,
      HOME: this._cwd,
      PWD: this._cwd,
      PATH: '/bin:/usr/bin',
      SHELL: '/bin/sh',
      TERM: 'webos-terminal',
      ...(config?.env ?? {}),
    });

    this._history = new ShellHistory(config?.maxHistorySize ?? 100);
  }

  public setShell(shell: Shell): void {
    this._shell = shell;
  }

  public getShell(): Shell | null {
    return this._shell;
  }

  public getCwd(): string {
    return this._cwd;
  }

  public setCwd(newCwd: string): void {
    this._cwd = newCwd;
    this._env.setVariable('PWD', newCwd);
  }

  public getEnv(): Environment {
    return this._env;
  }

  public getHistory(): readonly string[] {
    return this._history.getHistory();
  }

  public clearHistory(): void {
    this._history.clear();
  }

  public async execute(commandLine: string): Promise<CommandResult> {
    if (!this._shell) {
      throw new Error('ShellSession is not bound to a Shell service instance');
    }

    this._history.add(commandLine);
    const context = CommandContextFactory.create(this._shell, this);
    return CommandExecutor.execute(commandLine, context);
  }
}
