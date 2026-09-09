/**
 * @file FuzzySearchEngine.ts
 * @description Damerau-Levenshtein distance calculation and multi-token fuzzy search engine.
 */

export class FuzzySearchEngine {
  /**
   * Computes Damerau-Levenshtein distance with transposition support.
   */
  public static levenshtein(a: string, b: string): number {
    const al = a.length;
    const bl = b.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= al; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= bl; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let val = Math.min(
          matrix[i - 1]![j]! + 1, // deletion
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j - 1]! + cost // substitution
        );

        // Transposition
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          val = Math.min(val, matrix[i - 2]![j - 2]! + cost);
        }

        matrix[i]![j] = val;
      }
    }

    return matrix[al]![bl]!;
  }

  /**
   * Calculates similarity score between 0.0 (unrelated) and 1.0 (exact match).
   */
  public static similarity(query: string, candidate: string): number {
    const q = query.toLowerCase().trim();
    const c = candidate.toLowerCase().trim();
    if (!q || !c) return 0;
    if (q === c) return 1.0;
    if (c.includes(q)) return 0.9;

    // Check similarity across individual tokens/words in candidate
    const words = c.split(/[^a-z0-9]+/);
    let maxWordSim = 0;
    for (const w of words) {
      if (!w) continue;
      const maxLen = Math.max(q.length, w.length);
      const dist = this.levenshtein(q, w);
      const sim = Math.max(0, 1.0 - (dist / maxLen));
      if (sim > maxWordSim) maxWordSim = sim;
    }

    const fullMaxLen = Math.max(q.length, c.length);
    const fullDist = this.levenshtein(q, c);
    const fullSim = Math.max(0, 1.0 - (fullDist / fullMaxLen));

    return Math.max(maxWordSim, fullSim);
  }

  /**
   * Searches a list of candidates returning results ordered by fuzzy similarity.
   */
  public static search(query: string, candidates: readonly string[], minScore: number = 0.4): { text: string; score: number }[] {
    return candidates
      .map((text) => ({ text, score: this.similarity(query, text) }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }
}
