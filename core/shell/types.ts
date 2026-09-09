/**
 * @file core/shell/types.ts
 * @description Core types for Member 2 Shell engine, command parsing, execution context, and autocomplete.
 */

export interface ShellCommandOption {
  name: string;
  shortFlag?: string;
  description: string;
  hasValue?: boolean;
}

export interface ShellCommandDefinition {
  name: string;
  description: string;
  usage: string;
  category: 'filesystem' | 'system' | 'process' | 'utility' | 'developer';
  options?: ShellCommandOption[];
  execute: (args: string[], context: ShellExecutionContext) => Promise<ShellExecutionResult>;
}

export interface ShellExecutionContext {
  cwd: string;
  env: Record<string, string>;
  aliases: Record<string, string>;
  history: string[];
  user: string;
  pid?: number;
  shell: IMember2Shell;
}

export interface ShellExecutionResult {
  code: number; // 0 for success, non-zero for error
  output?: string;
  error?: string;
  type?: 'text' | 'table' | 'json' | 'html';
  data?: any;
  clearTerminal?: boolean;
  newCwd?: string;
}

export interface ParsedCommandToken {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  pipeTo?: ParsedCommandToken;
  redirectTo?: {
    file: string;
    append: boolean;
  };
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'command' | 'file' | 'directory' | 'flag' | 'history';
  description?: string;
}

export interface IMember2Shell {
  getCwd(): string;
  setCwd(path: string): Promise<boolean>;
  getEnv(): Record<string, string>;
  setEnv(key: string, value: string): void;
  getAliases(): Record<string, string>;
  setAlias(name: string, command: string): void;
  removeAlias(name: string): void;
  executeCommand(rawLine: string, customCwd?: string): Promise<ShellExecutionResult>;
  autocomplete(input: string, cursorPosition?: number): Promise<AutocompleteSuggestion[]>;
  getHistory(): string[];
  clearHistory(): void;
  registerCommand(cmd: ShellCommandDefinition): void;
}
