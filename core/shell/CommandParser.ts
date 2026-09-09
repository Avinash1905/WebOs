/**
 * @file core/shell/CommandParser.ts
 * @description Advanced command parser supporting quotes, escaping, flags, environment variables, pipes, and redirection.
 */

import type { ParsedCommandToken } from './types.js';

export class CommandParser {
  /**
   * Expands environment variables in a raw line.
   */
  public static expandEnv(line: string, env: Record<string, string>): string {
    return line.replace(/\$([A-Z0-9_]+)/gi, (_, key) => {
      return env[key] !== undefined ? env[key] : '';
    });
  }

  /**
   * Tokenizes a raw string into command arguments, supporting quotes and escapes.
   */
  public static tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inDoubleQuotes = false;
    let inSingleQuotes = false;
    let isEscaped = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (isEscaped) {
        current += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\' && !inSingleQuotes) {
        isEscaped = true;
        continue;
      }

      if (char === '"' && !inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
        continue;
      }

      if (char === "'" && !inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
        continue;
      }

      if ((char === ' ' || char === '\t') && !inDoubleQuotes && !inSingleQuotes) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Parses tokenized string into structured command object with flags, pipes, and redirection.
   */
  public static parse(line: string, env: Record<string, string> = {}): ParsedCommandToken | null {
    const expandedLine = this.expandEnv(line.trim(), env);
    if (!expandedLine) return null;

    // Check for pipes
    const pipeParts = expandedLine.split(/\s+\|\s+/);
    if (pipeParts.length > 1) {
      const firstPart = pipeParts[0]!;
      const remainingLine = pipeParts.slice(1).join(' | ');
      const parsedFirst = this.parse(firstPart, env);
      if (parsedFirst) {
        parsedFirst.pipeTo = this.parse(remainingLine, env) || undefined;
      }
      return parsedFirst;
    }

    // Check for redirection
    let targetLine = expandedLine;
    let redirection: { file: string; append: boolean } | undefined;

    if (expandedLine.includes('>>')) {
      const [before, after] = expandedLine.split('>>');
      targetLine = before!.trim();
      const fileToken = this.tokenize(after!.trim())[0];
      if (fileToken) {
        redirection = { file: fileToken, append: true };
      }
    } else if (expandedLine.includes('>')) {
      const [before, after] = expandedLine.split('>');
      targetLine = before!.trim();
      const fileToken = this.tokenize(after!.trim())[0];
      if (fileToken) {
        redirection = { file: fileToken, append: false };
      }
    }

    const rawTokens = this.tokenize(targetLine);
    if (rawTokens.length === 0) return null;

    const command = rawTokens[0]!;
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};

    for (let i = 1; i < rawTokens.length; i++) {
      const token = rawTokens[i]!;

      if (token.startsWith('--')) {
        const flagName = token.substring(2);
        if (flagName.includes('=')) {
          const [key, val] = flagName.split('=');
          flags[key!] = val || true;
        } else {
          // Check next token if value
          const next = rawTokens[i + 1];
          if (next && !next.startsWith('-')) {
            flags[flagName] = next;
            i++;
          } else {
            flags[flagName] = true;
          }
        }
      } else if (token.startsWith('-') && token.length > 1) {
        const flagChars = token.substring(1).split('');
        flagChars.forEach((c) => {
          flags[c] = true;
        });
      } else {
        args.push(token);
      }
    }

    return {
      command,
      args,
      flags,
      redirectTo: redirection,
    };
  }
}
