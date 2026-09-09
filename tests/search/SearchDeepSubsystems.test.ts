import { describe, expect, it } from 'vitest';
import {
  FuzzySearchEngine,
  MetadataSearchFilter,
  InvertedIndexManager,
  SearchQueryPlanner,
} from '../../core/search/index.js';

describe('Search Deep Subsystems', () => {
  it('FuzzySearchEngine calculates Levenshtein distance and ranks fuzzy matches', () => {
    expect(FuzzySearchEngine.levenshtein('kitten', 'sitting')).toBe(3);
    expect(FuzzySearchEngine.similarity('kernel', 'kernel')).toBe(1.0);
    expect(FuzzySearchEngine.similarity('kernal', 'kernel')).toBeGreaterThan(0.8);

    const candidates = ['kernel_module.ts', 'keyboard_driver.ts', 'kernel_panic.ts', 'network_socket.ts'];
    const results = FuzzySearchEngine.search('kernal', candidates, 0.5);

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]!.text).toContain('kernel');
  });

  it('MetadataSearchFilter filters resources across multiple constraints', () => {
    const resources = [
      {
        id: '1',
        path: '/sys/kernel.log',
        size: 5000,
        createdAt: 1000,
        modifiedAt: 2000,
        mimeType: 'text/plain',
        owner: 'root',
        tags: ['log', 'system'],
      },
      {
        id: '2',
        path: '/home/user/photo.jpg',
        size: 50000,
        createdAt: 1500,
        modifiedAt: 2500,
        mimeType: 'image/jpeg',
        owner: 'user',
        tags: ['media'],
      },
    ];

    const logs = MetadataSearchFilter.filter(resources, {
      pathPrefix: '/sys',
      minSize: 1000,
      mimeType: 'text/plain',
      requiredTags: ['system'],
    });

    expect(logs.length).toBe(1);
    expect(logs[0]!.id).toBe('1');
  });

  it('InvertedIndexManager indexes documents and computes TF-IDF scores for queries', () => {
    const index = new InvertedIndexManager();

    index.indexDocument('doc1', 'the quick brown fox jumps over the lazy dog');
    index.indexDocument('doc2', 'operating system kernel scheduler and process manager');
    index.indexDocument('doc3', 'the lazy dog slept all day long');

    const results = index.search('kernel scheduler');
    expect(results.length).toBe(1);
    expect(results[0]!.docId).toBe('doc2');

    const dogResults = index.search('lazy dog');
    expect(dogResults.length).toBe(2);
  });

  it('SearchQueryPlanner parses search queries into AST with AND/OR support', () => {
    const ast1 = SearchQueryPlanner.parse('kernel AND scheduler');
    expect(ast1.type).toBe('AND');
    expect(ast1.left?.term).toBe('kernel');
    expect(ast1.right?.term).toBe('scheduler');

    const ast2 = SearchQueryPlanner.parse('storage OR filesystem');
    expect(ast2.type).toBe('OR');
    expect(ast2.left?.term).toBe('storage');
    expect(ast2.right?.term).toBe('filesystem');
  });
});
