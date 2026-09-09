/**
 * @file CommandRegistry.ts
 * @description Central registry for WebOS shell commands.
 */

import { ShellError } from './ShellError.js';
import type { CommandDefinition } from './types.js';

export class CommandRegistry {
  private readonly _commands = new Map<string, CommandDefinition>();
  private readonly _aliases = new Map<string, string>(); // alias -> commandName

  public registerCommand(command: CommandDefinition, allowOverwrite = false): void {
    const name = command.name.toLowerCase();
    if (this._commands.has(name) && !allowOverwrite) {
      throw new ShellError(`Command '${name}' is already registered`, 'DUPLICATE_COMMAND');
    }

    this._commands.set(name, command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this._aliases.set(alias.toLowerCase(), name);
      }
    }
  }

  public unregisterCommand(name: string): boolean {
    const lower = name.toLowerCase();
    const command = this._commands.get(lower);
    if (!command) return false;

    this._commands.delete(lower);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this._aliases.delete(alias.toLowerCase());
      }
    }

    return true;
  }

  public getCommand(name: string): CommandDefinition | null {
    const lower = name.toLowerCase();
    const direct = this._commands.get(lower);
    if (direct) return direct;

    const aliasTarget = this._aliases.get(lower);
    if (aliasTarget) {
      return this._commands.get(aliasTarget) ?? null;
    }

    return null;
  }

  public hasCommand(name: string): boolean {
    const lower = name.toLowerCase();
    return this._commands.has(lower) || this._aliases.has(lower);
  }

  public listCommands(): CommandDefinition[] {
    return Array.from(this._commands.values());
  }
}
