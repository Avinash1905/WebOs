/**
 * @file SemanticVectorIndex.ts
 * @description Embeddings vector index with Cosine Similarity k-Nearest Neighbors search.
 */

export class SemanticVectorIndex {
  private readonly _vectors = new Map<string, number[]>(); // docId -> embedding

  public insert(docId: string, embedding: number[]): void {
    this._vectors.set(docId, embedding);
  }

  public searchKNN(queryVec: number[], topK: number = 5): { docId: string; similarity: number }[] {
    const results: { docId: string; similarity: number }[] = [];

    for (const [docId, vec] of this._vectors.entries()) {
      const sim = this.cosineSimilarity(queryVec, vec);
      results.push({ docId, similarity: Number(sim.toFixed(4)) });
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const av = a[i]!;
      const bv = b[i]!;
      dot += av * bv;
      normA += av * av;
      normB += bv * bv;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
