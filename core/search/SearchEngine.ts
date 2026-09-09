/**
 * @file SearchEngine.ts
 * @description WebOS VFS Search Engine Service with indexing, permission filtering, and caching.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/index.js';
import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import type { StorageEngine } from '../storage/index.js';
import { SearchCache } from './SearchCache.js';
import { SearchError } from './SearchError.js';
import { SearchFilter } from './SearchFilter.js';
import { SearchIndex } from './SearchIndex.js';
import { SearchIndexer } from './SearchIndexer.js';
import { SearchQuery } from './SearchQuery.js';
import { SearchSort } from './SearchSort.js';
import type {
  SearchEngineConfig,
  SearchOptions,
  SearchResult,
  SearchResultItem,
} from './types.js';

export class SearchEngine extends BaseSystemService {
  public override readonly name = 'search';
  public override readonly dependencies: readonly string[] = ['filesystem'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'permissions',
    'storage',
  ];

  private readonly _index = new SearchIndex();
  private readonly _cache: SearchCache;
  private _indexer?: SearchIndexer;

  private _fileSystem?: FileSystem;
  private _eventBus?: EventBus;
  public permissionManager?: PermissionManager;
  public storageEngine?: StorageEngine;

  constructor(config?: SearchEngineConfig) {
    super();
    this._cache = new SearchCache(
      config?.maxCacheSize ?? 50,
      config?.cacheTtlMs ?? 30000
    );
    this._fileSystem = config?.fileSystem;
    this._eventBus = config?.eventBus;
    this.permissionManager = config?.permissionManager;
    this.storageEngine = config?.storage;
  }

  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  public attachPermissionManager(permissionManager: PermissionManager): void {
    this.permissionManager = permissionManager;
  }

  public attachStorage(storage: StorageEngine): void {
    this.storageEngine = storage;
  }

  public async buildIndex(rootPath = '/'): Promise<number> {
    if (!this._fileSystem) {
      throw new SearchError('FileSystem service is required to build search index');
    }

    this._index.clear();
    this._cache.clear();

    const items = await this._fileSystem.listDirectory(rootPath, {
      recursive: true,
      includeHidden: true,
    });

    for (const item of items) {
      this._index.add(item);
    }

    if (this._eventBus) {
      this._eventBus.emit('SEARCH_INDEX_UPDATED', {
        totalIndexed: this._index.size(),
        timestamp: Date.now(),
      });
    }

    return this._index.size();
  }

  public async search(
    options: SearchOptions,
    context?: Partial<SecurityContext>
  ): Promise<SearchResult> {
    const startTime = performance.now();
    const query = new SearchQuery(options);
    const rootPath = options.rootPath ?? '/';
    const cacheKey = JSON.stringify({
      q: options.query,
      root: rootPath,
      types: options.fileTypes,
      exts: options.extensions,
      incF: options.includeFiles,
      incD: options.includeDirectories,
      cs: options.caseSensitive,
      exact: options.exactMatch,
      sortBy: options.sortBy,
      order: options.sortOrder,
      max: options.maxResults,
      user: context?.userId,
    });

    const cached = this._cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        durationMs: Number((performance.now() - startTime).toFixed(2)),
      };
    }

    let entries = this._index.getAll();

    if (entries.length === 0 && this._fileSystem) {
      await this.buildIndex('/');
      entries = this._index.getAll();
    }

    const matchedItems: SearchResultItem[] = [];

    for (const entry of entries) {
      if (!SearchFilter.matchesOptions(entry, options)) {
        continue;
      }

      if (options.exactMatch) {
        const matches = options.caseSensitive
          ? entry.name === options.query.trim()
          : entry.name.toLowerCase() === options.query.trim().toLowerCase();
        if (!matches) continue;
      }

      const score = query.score(entry.name, entry.path);
      if (score <= 0 && options.query.trim().length > 0) {
        continue;
      }

      const hasPerm = await SearchFilter.hasPermission(
        entry,
        this.permissionManager,
        options.context ?? context
      );
      if (!hasPerm) {
        continue;
      }

      matchedItems.push({
        path: entry.path,
        name: entry.name,
        type: entry.type,
        size: entry.size,
        mimeType: entry.mimeType,
        updatedAt: entry.updatedAt,
        score,
      });
    }

    const sorted = SearchSort.sort(matchedItems, options.sortBy, options.sortOrder);
    const maxResults = options.maxResults ?? 100;
    const finalItems = sorted.slice(0, maxResults);

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    const finalResult: SearchResult = {
      query: options.query,
      total: matchedItems.length,
      items: finalItems,
      durationMs,
      rootPath,
    };

    this._cache.set(cacheKey, finalResult);

    if (this._eventBus) {
      this._eventBus.emit('SEARCH_PERFORMED', {
        query: options.query,
        resultCount: matchedItems.length,
        executionTimeMs: durationMs,
        timestamp: Date.now(),
      });
    }

    return finalResult;
  }

  public clearIndex(): void {
    this._index.clear();
    this._cache.clear();
  }

  public getIndexSize(): number {
    return this._index.size();
  }

  protected override async onInitialize(): Promise<void> {
    this._indexer = new SearchIndexer(
      this._index,
      this._eventBus,
      this._fileSystem,
      () => this._cache.clear()
    );
    this._indexer.start();
  }

  protected override async onStart(): Promise<void> {
    if (this._fileSystem) {
      try {
        await this.buildIndex('/');
      } catch {}
    }
  }

  protected override async onStop(): Promise<void> {
    this._indexer?.stop();
    this.clearIndex();
  }
}
