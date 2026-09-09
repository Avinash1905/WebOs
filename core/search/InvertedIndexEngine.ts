/**
 * @file InvertedIndexEngine.ts
 * @description Inverted Index with TF-IDF term scoring for full-text search.
 */

export interface IndexedDocument {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly path: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SearchScoreResult {
  readonly id: string;
  readonly score: number;
  readonly doc: IndexedDocument;
}

export class InvertedIndexEngine {
  private readonly documents = new Map<string, IndexedDocument>();
  private readonly invertedIndex = new Map<string, Map<string, number>>(); // term -> (docId -> termFrequency)

  public addDocument(doc: IndexedDocument): void {
    this.documents.set(doc.id, doc);
    const tokens = this.tokenize(`${doc.title} ${doc.content}`);

    for (const term of tokens) {
      let postings = this.invertedIndex.get(term);
      if (!postings) {
        postings = new Map();
        this.invertedIndex.set(term, postings);
      }
      const tf = (postings.get(doc.id) ?? 0) + 1;
      postings.set(doc.id, tf);
    }
  }

  public removeDocument(docId: string): void {
    this.documents.delete(docId);
    for (const postings of this.invertedIndex.values()) {
      postings.delete(docId);
    }
  }

  public search(query: string, maxResults = 20): readonly SearchScoreResult[] {
    const terms = this.tokenize(query);
    if (terms.length === 0) return [];

    const scores = new Map<string, number>();
    const totalDocs = Math.max(1, this.documents.size);

    for (const term of terms) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      // Inverse Document Frequency (IDF)
      const idf = Math.log(1 + totalDocs / Math.max(1, postings.size));

      for (const [docId, tf] of postings.entries()) {
        const score = (scores.get(docId) ?? 0) + tf * idf;
        scores.set(docId, score);
      }
    }

    const results: SearchScoreResult[] = [];
    for (const [docId, score] of scores.entries()) {
      const doc = this.documents.get(docId);
      if (doc) {
        results.push({ id: docId, score, doc });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public getVocabularySize(): number {
    return this.invertedIndex.size;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }
}
