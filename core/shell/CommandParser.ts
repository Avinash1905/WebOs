/**
 * @file CommandParser.ts
 * @description Safe tokenizer and argument parser for shell command lines.
 * Supports quoted arguments, escape characters, short flags (-la), and long options (--flag=value).
 */

import { InvalidCommandSyntaxError } from './ShellError.js';
import type { ParsedCommandLine } from './types.js';

export class CommandParser {
  /**
   * Parses a raw command string into a structured ParsedCommandLine.
   */
  public static parse(input: string): ParsedCommandLine {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        command: '',
        args: [],
        flags: {},
        raw: input,
      };
    }

    const tokens = this._tokenize(trimmed);
    if (tokens.length === 0) {
      return {
        command: '',
        args: [],
        flags: {},
        raw: input,
      };
    }

    const command = tokens[0]!;
    const rawArgs = tokens.slice(1);

    const args: string[] = [];
    const flags: Record<string, boolean | string> = {};

    let parseFlags = true;

    for (let i = 0; i < rawArgs.length; i++) {
      const token = rawArgs[i]!;

      // Handle "--" delimiter (treats all subsequent tokens as positional args)
      if (parseFlags && token === '--') {
        parseFlags = false;
        continue;
      }

      if (parseFlags && token.startsWith('--') && token.length > 2) {
        // Long flag: --name or --name=value
        const content = token.slice(2);
        const eqIdx = content.indexOf('=');
        if (eqIdx !== -1) {
          const key = content.slice(0, eqIdx);
          const val = content.slice(eqIdx + 1);
          flags[key] = val;
        } else {
          flags[content] = true;
        }
      } else if (parseFlags && token.startsWith('-') && token.length > 1 && !/^-d+$/.test(token)) {
        // Short flag(s): -l, -la, -n=value
        const content = token.slice(1);
        const eqIdx = content.indexOf('=');
        if (eqIdx !== -1) {
          const key = content.slice(0, eqIdx);
          const val = content.slice(eqIdx + 1);
          flags[key] = val;
        } else if (content.length === 1) {
          flags[content] = true;
        } else {
          // Combined short flags like -la -> l: true, a: true
          for (const char of content) {
            flags[char] = true;
          }
        }
      } else {
        // Positional argument
        args.push(token);
      }
    }

    return {
      command,
      args: Object.freeze(args),
      flags: Object.freeze(flags),
      raw: input,
    };
  }

  private static _tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i]!;

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        escapeNext = true;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (inSingleQuote || inDoubleQuote) {
      throw new InvalidCommandSyntaxError('Unterminated quoted string');
    }

    if (escapeNext) {
      current += '\\';
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }
}
