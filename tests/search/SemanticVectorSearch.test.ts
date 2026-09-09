import { describe, expect, it } from 'vitest';
import { SemanticVectorIndex } from '../../core/search/index.js';

describe('Semantic Vector Search', () => {
  it('SemanticVectorIndex inserts vectors and computes Cosine Similarity KNN', () => {
    const index = new SemanticVectorIndex();

    index.insert('doc_kernel', [1.0, 0.0, 0.0]);
    index.insert('doc_scheduler', [0.9, 0.1, 0.0]);
    index.insert('doc_music', [0.0, 1.0, 0.0]);

    const results = index.searchKNN([1.0, 0.0, 0.0], 2);
    expect(results.length).toBe(2);
    expect(results[0]!.docId).toBe('doc_kernel');
    expect(results[0]!.similarity).toBe(1.0);
    expect(results[1]!.docId).toBe('doc_scheduler');
  });
});
