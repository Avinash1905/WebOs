/**
 * @file PatternMatcher.ts
 * @description Dot-notation wildcard & hierarchical pattern matching engine for system events.
 */

export class PatternMatcher {
  private static readonly _regexCache = new Map<string, RegExp>();

  /**
   * Compiles a wildcard pattern (e.g. 'storage.*', 'user.**.created') into a RegExp.
   */
  public static compile(pattern: string): RegExp {
    const cached = this._regexCache.get(pattern);
    if (cached) return cached;

    // 1. Replace '**' with placeholder '\x01'
    // 2. Replace '*' with placeholder '\x02'
    // 3. Escape regex special characters (including '.')
    // 4. Restore '\x01' as '.*' (any depth match)
    // 5. Restore '\x02' as '[^.]+' (single segment match)
    const formatted = pattern
      .replace(/\*\*/g, '\x01')
      .replace(/\*/g, '\x02')
      .replace(/[+?^${}()|[\]\\.]/g, '\\$&')
      .replace(/\x01/g, '.*')
      .replace(/\x02/g, '[^.]+');

    const regex = new RegExp(`^${formatted}$`);
    this._regexCache.set(pattern, regex);
    return regex;
  }

  /**
   * Tests whether an event type matches a wildcard pattern.
   */
  public static matches(pattern: string, eventType: string): boolean {
    if (pattern === '*' || pattern === '**' || pattern === eventType) {
      return true;
    }
    const regex = this.compile(pattern);
    return regex.test(eventType);
  }

  public static clearCache(): void {
    this._regexCache.clear();
  }
}
