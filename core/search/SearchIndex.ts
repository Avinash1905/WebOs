/**
 * @file SearchIndex.ts
 * @description In-memory index of VFS files and directories for fast search lookup.
 */

import type { FileMetadata } from '../filesystem/index.js';
import type { SearchIndexEntry } from './types.js';

export class SearchIndex {
  private readonly _entriesByPath = new Map<string, SearchIndexEntry>();

  public add(metadata: FileMetadata): void {
    const tokens = this._tokenize(metadata.name);
    const entry: SearchIndexEntry = {
      path: metadata.path,
      name: metadata.name,
      type: metadata.type,
      size: metadata.size,
      mimeType: metadata.mimeType,
      extension: metadata.extension,
      ownerId: metadata.ownerId,
      mode: metadata.mode ?? 0o644,
      updatedAt: metadata.updatedAt,
      tokens,
    };
    this._entriesByPath.set(metadata.path, entry);
  }

  public update(metadata: FileMetadata): void {
    this.add(metadata);
  }

  public remove(path: string): boolean {
    return this._entriesByPath.delete(path);
  }

  public get(path: string): SearchIndexEntry | undefined {
    return this._entriesByPath.get(path);
  }

  public getAll(): SearchIndexEntry[] {
    return Array.from(this._entriesByPath.values());
  }

  public size(): number {
    return this._entriesByPath.size;
  }

  public clear(): void {
    this._entriesByPath.clear();
  }

  private _tokenize(name: string): string[] {
    const tokens = new Set<string>();
    const cleaned = name.toLowerCase();

    tokens.add(cleaned);

    const parts = cleaned.split(/[_\-\.\s]+/);
    for (const part of parts) {
      if (part.length > 0) {
        tokens.add(part);
      }
    }

    return Array.from(tokens);
  }
}
