/**
 * @file ExtendedBuiltins.ts
 * @description Extended POSIX command utilities (grep, wc, head, tail, which, uptime).
 */

export class ExtendedBuiltins {
  public static grep(lines: string[], pattern: string, options?: { ignoreCase?: boolean; invertMatch?: boolean }): string[] {
    const flags = options?.ignoreCase ? 'i' : '';
    const regex = new RegExp(pattern, flags);

    return lines.filter(line => {
      const matches = regex.test(line);
      return options?.invertMatch ? !matches : matches;
    });
  }

  public static wc(content: string): { lines: number; words: number; bytes: number } {
    const lines = content.length > 0 ? content.split('\n').length : 0;
    const words = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
    const bytes = new TextEncoder().encode(content).length;

    return { lines, words, bytes };
  }

  public static head(lines: string[], count = 10): string[] {
    return lines.slice(0, count);
  }

  public static tail(lines: string[], count = 10): string[] {
    return lines.slice(Math.max(0, lines.length - count));
  }
}
