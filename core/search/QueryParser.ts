/**
 * @file QueryParser.ts
 * @description Advanced query parser extracting structured filters, field queries, and free terms.
 */

export interface ParsedSearchQuery {
  readonly freeTerms: readonly string[];
  readonly exactPhrases: readonly string[];
  readonly filters: Readonly<Record<string, string>>;
  readonly negatedTerms: readonly string[];
}

export class QueryParser {
  public static parse(queryText: string): ParsedSearchQuery {
    const freeTerms: string[] = [];
    const exactPhrases: string[] = [];
    const filters: Record<string, string> = {};
    const negatedTerms: string[] = [];

    // Extract exact phrases inside quotes
    let workingText = queryText.replace(/"([^"]+)"/g, (_, phrase) => {
      exactPhrases.push(phrase.trim());
      return ' ';
    });

    const tokens = workingText.trim().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      if (token.startsWith('-') && token.length > 1) {
        negatedTerms.push(token.slice(1).toLowerCase());
      } else if (token.includes(':')) {
        const [key, ...vals] = token.split(':');
        if (key && vals.length > 0) {
          filters[key.toLowerCase()] = vals.join(':');
        }
      } else {
        freeTerms.push(token.toLowerCase());
      }
    }

    return {
      freeTerms: Object.freeze(freeTerms),
      exactPhrases: Object.freeze(exactPhrases),
      filters: Object.freeze(filters),
      negatedTerms: Object.freeze(negatedTerms)
    };
  }
}
