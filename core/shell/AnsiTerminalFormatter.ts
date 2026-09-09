/**
 * @file AnsiTerminalFormatter.ts
 * @description ANSI escape code parser and 24-bit TrueColor terminal styling engine.
 */

export class AnsiTerminalFormatter {
  public static readonly RESET = '\x1b[0m';
  public static readonly BOLD = '\x1b[1m';
  public static readonly RED = '\x1b[31m';
  public static readonly GREEN = '\x1b[32m';
  public static readonly YELLOW = '\x1b[33m';
  public static readonly BLUE = '\x1b[34m';
  public static readonly CYAN = '\x1b[36m';

  public static colorize(text: string, colorCode: string): string {
    return `${colorCode}${text}${this.RESET}`;
  }

  public static rgb(text: string, r: number, g: number, b: number): string {
    return `\x1b[38;2;${r};${g};${b}m${text}${this.RESET}`;
  }

  public static stripAnsi(text: string): string {
    return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  }

  public static cursorTo(row: number, col: number): string {
    return `\x1b[${row};${col}H`;
  }

  public static clearScreen(): string {
    return '\x1b[2J\x1b[H';
  }
}
