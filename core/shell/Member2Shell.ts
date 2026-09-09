/**
 * @file core/shell/Member2Shell.ts
 * @description Core Member 2 Shell Engine implementation bridging VFS, ProcessManager, StorageEngine, and EventBus.
 */

import { platform } from '../../src/services/webosPlatform.js';
import { CommandParser } from './CommandParser.js';
import { commandRegistry } from './CommandRegistry.js';
import { AutocompleteEngine } from './AutocompleteEngine.js';
import type {
  IMember2Shell,
  ShellCommandDefinition,
  ShellExecutionContext,
  ShellExecutionResult,
  AutocompleteSuggestion,
} from './types.js';

const SHELL_HISTORY_STORAGE_KEY = 'webos_shell_history';
const MAX_HISTORY_ITEMS = 500;

export class Member2Shell implements IMember2Shell {
  private cwd: string = '/home/user';
  private env: Record<string, string> = {
    USER: 'user',
    HOME: '/home/user',
    PATH: '/bin:/usr/bin',
    SHELL: '/bin/member2_shell',
    TERM: 'webos-xterm-256color',
  };
  private aliases: Record<string, string> = {
    ll: 'ls -la',
    la: 'ls -a',
    cls: 'clear',
    dir: 'ls',
  };
  private history: string[] = [];

  constructor() {
    this.loadHistory();
  }

  public getCwd(): string {
    return this.cwd;
  }

  public async setCwd(path: string): Promise<boolean> {
    try {
      const exists = await platform.fileSystem.exists(path);
      if (!exists) return false;
      const stat = await platform.fileSystem.stat(path);
      if (stat.type !== 'directory') return false;
      this.cwd = path;
      this.env.PWD = path;
      return true;
    } catch {
      return false;
    }
  }

  public getEnv(): Record<string, string> {
    return { ...this.env };
  }

  public setEnv(key: string, value: string): void {
    this.env[key] = value;
  }

  public getAliases(): Record<string, string> {
    return { ...this.aliases };
  }

  public setAlias(name: string, command: string): void {
    this.aliases[name] = command;
  }

  public removeAlias(name: string): void {
    delete this.aliases[name];
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  public registerCommand(cmd: ShellCommandDefinition): void {
    commandRegistry.register(cmd);
  }

  private async loadHistory(): Promise<void> {
    try {
      await platform.initialize();
      const saved = await platform.storage.get<string[]>(SHELL_HISTORY_STORAGE_KEY);
      if (saved && Array.isArray(saved)) {
        this.history = saved;
      }
    } catch {
      // fallback
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await platform.storage.set(SHELL_HISTORY_STORAGE_KEY, this.history);
    } catch {
      // fallback
    }
  }

  private recordHistory(line: string): void {
    const clean = line.trim();
    if (!clean) return;
    // Don't record consecutive duplicates
    if (this.history.length > 0 && this.history[this.history.length - 1] === clean) {
      return;
    }
    this.history.push(clean);
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(this.history.length - MAX_HISTORY_ITEMS);
    }
    this.saveHistory();
  }

  public async executeCommand(rawLine: string, customCwd?: string): Promise<ShellExecutionResult> {
    const execCwd = customCwd || this.cwd;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      return { code: 0 };
    }

    this.recordHistory(trimmed);

    // Alias expansion
    let lineToParse = trimmed;
    const firstWord = trimmed.split(' ')[0]!;
    if (this.aliases[firstWord]) {
      lineToParse = trimmed.replace(firstWord, this.aliases[firstWord]!);
    }

    const ast = CommandParser.parse(lineToParse, this.env);
    if (!ast) {
      return { code: 0 };
    }

    const cmdDef = commandRegistry.get(ast.command);
    if (!cmdDef) {
      return {
        code: 127,
        error: `member2_shell: command not found: ${ast.command}. Type 'help' for available commands.`,
      };
    }

    const context: ShellExecutionContext = {
      cwd: execCwd,
      env: this.env,
      aliases: this.aliases,
      history: this.history,
      user: this.env.USER || 'user',
      shell: this,
    };

    try {
      const result = await cmdDef.execute(ast.args, context);

      if (result.newCwd) {
        this.cwd = result.newCwd;
        this.env.PWD = result.newCwd;
      }

      // Handle redirection if present
      if (ast.redirectTo && result.output !== undefined) {
        const redir = ast.redirectTo;
        const targetPath = redir.file.startsWith('/')
          ? redir.file
          : `${this.cwd === '/' ? '' : this.cwd}/${redir.file}`;

        if (redir.append && (await platform.fileSystem.exists(targetPath))) {
          await platform.fileSystem.appendFile(targetPath, result.output + '\n');
        } else {
          await platform.fileSystem.createFile(targetPath, { content: result.output, overwrite: true });
        }
      }

      // Handle piping if present
      if (ast.pipeTo && result.output !== undefined) {
        const nextCmd = ast.pipeTo.command;
        const nextDef = commandRegistry.get(nextCmd);
        if (nextDef) {
          const pipedArgs = [...ast.pipeTo.args, result.output];
          return await nextDef.execute(pipedArgs, context);
        }
      }

      // Emit event bus notification
      platform.eventBus.emit('TERMINAL_COMMAND_EXECUTED', {
        command: ast.command,
        args: ast.args,
        code: result.code,
        cwd: this.cwd,
      });

      return result;
    } catch (err: any) {
      return {
        code: 1,
        error: err?.message || `member2_shell: error executing ${ast.command}`,
      };
    }
  }

  public async autocomplete(input: string): Promise<AutocompleteSuggestion[]> {
    return AutocompleteEngine.getSuggestions(input, this);
  }
}

export const member2Shell = new Member2Shell();
