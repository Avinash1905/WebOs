/**
 * @file IncrementalIndexer.ts
 * @description Real-time indexing coordinator syncing VFS file events to the search engine.
 */

import type { InvertedIndexEngine } from './InvertedIndexEngine.js';

export class IncrementalIndexer {
  constructor(private readonly indexEngine: InvertedIndexEngine) {}

  public onFileCreated(path: string, content: string, title?: string): void {
    const name = path.split('/').pop() || path;
    this.indexEngine.addDocument({
      id: path,
      title: title || name,
      content,
      path
    });
  }

  public onFileUpdated(path: string, newContent: string): void {
    this.onFileDeleted(path);
    this.onFileCreated(path, newContent);
  }

  public onFileDeleted(path: string): void {
    this.indexEngine.removeDocument(path);
  }
}
