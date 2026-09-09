/**
 * @file SearchQuery.ts
 * @description Query tokenizer, normalization, and scoring algorithm for search matches.
 */

import { InvalidSearchQueryError } from './SearchError.js';
import type { SearchOptions } from './types.js';

export class SearchQuery {
  public readonly rawQuery: string;
  public readonly normalizedQuery: string;
  public readonly tokens: readonly string[];
  public readonly caseSensitive: boolean;
  public readonly exactMatch: boolean;

  constructor(options: SearchOptions | string) {
    const raw = typeof options === 'string' ? options : options.query;
    if (typeof raw !== 'string') {
      throw new InvalidSearchQueryError('Query must be a string');
    }

    this.rawQuery = raw;
    this.caseSensitive = typeof options === 'object' ? Boolean(options.caseSensitive) : false;
    this.exactMatch = typeof options === 'object' ? Boolean(options.exactMatch) : false;

    this.normalizedQuery = this.caseSensitive ? raw.trim() : raw.trim().toLowerCase();
    this.tokens = this._tokenize(this.normalizedQuery);
  }

  /**
   * Calculates a relevance score [0..100] for a given target name and path.
   */
  public score(targetName: string, targetPath: string): number {
    const name = this.caseSensitive ? targetName : targetName.toLowerCase();
    const path = this.caseSensitive ? targetPath : targetPath.toLowerCase();

    if (!this.normalizedQuery) {
      return 10;
    }

    // 1. Exact name match
    if (name === this.normalizedQuery) {
      return 100;
    }

    // 2. Name starts with query
    if (name.startsWith(this.normalizedQuery)) {
      return 85;
    }

    // 3. Name contains query as a whole word or boundary
    if (
      name.includes('_' + this.normalizedQuery) ||
      name.includes('-' + this.normalizedQuery) ||
      name.includes('.' + this.normalizedQuery)
    ) {
      return 75;
    }

    // 4. Name contains query substring
    if (name.includes(this.normalizedQuery)) {
      return 60;
    }

    // 5. Path contains query substring
    if (path.includes(this.normalizedQuery)) {
      return 40;
    }

    // 6. Token-based matching
    let tokenMatches = 0;
    for (const token of this.tokens) {
      if (name.includes(token)) {
        tokenMatches += 2;
      } else if (path.includes(token)) {
        tokenMatches += 1;
      }
    }

    if (tokenMatches > 0 && this.tokens.length > 0) {
      const ratio = tokenMatches / (this.tokens.length * 2);
      return Math.round(ratio * 50);
    }

    return 0;
  }

  private _tokenize(input: string): string[] {
    return input
      .split(/[^a-zA-Z0-9_-]+/)
      .filter((t) => t.length > 0);
  }
}
