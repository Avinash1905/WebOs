import { describe, it, expect } from 'vitest';
import {
  InvertedIndexEngine,
  QueryParser,
  IncrementalIndexer
} from '../../core/search/index.js';

describe('Search Engine Expansions', () => {
  describe('InvertedIndexEngine', () => {
    it('should index documents and score results by relevance', () => {
      const engine = new InvertedIndexEngine();
      engine.addDocument({
        id: 'doc1',
        title: 'Kernel Architecture Guide',
        content: 'This document explains the WebOS microkernel architecture and event bus.',
        path: '/docs/kernel.txt'
      });
      engine.addDocument({
        id: 'doc2',
        title: 'Virtual File System Design',
        content: 'This guide covers the VFS layer, inodes, storage drivers, and permissions.',
        path: '/docs/vfs.txt'
      });

      const results = engine.search('microkernel event');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.id).toBe('doc1');
    });
  });

  describe('QueryParser', () => {
    it('should parse structured search queries with phrases, filters and negations', () => {
      const parsed = QueryParser.parse('"operating system" ext:ts author:admin -legacy kernel');
      expect(parsed.exactPhrases).toContain('operating system');
      expect(parsed.filters['ext']).toBe('ts');
      expect(parsed.filters['author']).toBe('admin');
      expect(parsed.negatedTerms).toContain('legacy');
      expect(parsed.freeTerms).toContain('kernel');
    });
  });

  describe('IncrementalIndexer', () => {
    it('should synchronize VFS events into index', () => {
      const engine = new InvertedIndexEngine();
      const indexer = new IncrementalIndexer(engine);

      indexer.onFileCreated('/home/user/notes.txt', 'Important meeting notes for WebOS release');
      expect(engine.search('meeting').length).toBe(1);

      indexer.onFileDeleted('/home/user/notes.txt');
      expect(engine.search('meeting').length).toBe(0);
    });
  });
});
