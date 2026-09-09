/**
 * @file InvertedIndexManager.ts
 * @description Full-text TF-IDF keyword indexing and posting lists manager.
 */

export class InvertedIndexManager {
  private readonly _postings = new Map<string, Map<string, number>>(); // word -> (docId -> termFreq)
  private readonly _docLengths = new Map<string, number>(); // docId -> totalWords

  public indexDocument(docId: string, content: string): void {
    const tokens = this.tokenize(content);
    this._docLengths.set(docId, tokens.length);

    const freqMap = new Map<string, number>();
    for (const t of tokens) {
      freqMap.set(t, (freqMap.get(t) ?? 0) + 1);
    }

    for (const [word, count] of freqMap.entries()) {
      let posting = this._postings.get(word);
      if (!posting) {
        posting = new Map();
        this._postings.set(word, posting);
      }
      posting.set(docId, count);
    }
  }

  public search(query: string): { docId: string; score: number }[] {
    const queryTokens = this.tokenize(query);
    const scores = new Map<string, number>();
    const totalDocs = this._docLengths.size;

    for (const qToken of queryTokens) {
      const posting = this._postings.get(qToken);
      if (!posting) continue;

      const docFreq = posting.size;
      const idf = Math.log(1 + (totalDocs / (docFreq || 1)));

      for (const [docId, termFreq] of posting.entries()) {
        const totalWords = this._docLengths.get(docId) || 1;
        const tf = termFreq / totalWords;
        const tfIdf = tf * idf;

        scores.set(docId, (scores.get(docId) ?? 0) + tfIdf);
      }
    }

    return Array.from(scores.entries())
      .map(([docId, score]) => ({ docId, score: Number(score.toFixed(4)) }))
      .sort((a, b) => b.score - a.score);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }
}
