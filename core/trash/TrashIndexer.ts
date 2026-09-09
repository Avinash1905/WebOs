/**
 * @file TrashIndexer.ts
 * @description Inverted multi-attribute search index for fast query retrieval of trash items.
 */

export interface IndexedTrashItem {
  readonly id: string;
  readonly originalPath: string;
  readonly name: string;
  readonly size: number;
  readonly deletedAt: number;
  readonly userId: string;
  readonly mimeType: string;
  readonly tags?: readonly string[];
}

export interface TrashQueryFilter {
  readonly namePattern?: string | RegExp;
  readonly pathPrefix?: string;
  readonly userId?: string;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly deletedAfter?: number;
  readonly deletedBefore?: number;
  readonly mimeType?: string;
  readonly tag?: string;
}

/**
 * High-performance inverted index supporting multi-dimensional range and prefix queries on trash.
 */
export class TrashIndexer {
  private readonly _items = new Map<string, IndexedTrashItem>();
  private readonly _userIndex = new Map<string, Set<string>>();
  private readonly _mimeIndex = new Map<string, Set<string>>();
  private readonly _tagIndex = new Map<string, Set<string>>();

  /**
   * Indexes a newly trashed item.
   */
  public indexItem(item: IndexedTrashItem): void {
    this._items.set(item.id, item);

    // Index by user
    let userSet = this._userIndex.get(item.userId);
    if (!userSet) {
      userSet = new Set();
      this._userIndex.set(item.userId, userSet);
    }
    userSet.add(item.id);

    // Index by mime
    let mimeSet = this._mimeIndex.get(item.mimeType);
    if (!mimeSet) {
      mimeSet = new Set();
      this._mimeIndex.set(item.mimeType, mimeSet);
    }
    mimeSet.add(item.id);

    // Index by tags
    if (item.tags) {
      for (const tag of item.tags) {
        let tagSet = this._tagIndex.get(tag);
        if (!tagSet) {
          tagSet = new Set();
          this._tagIndex.set(tag, tagSet);
        }
        tagSet.add(item.id);
      }
    }
  }

  /**
   * Removes an item from the index.
   */
  public unindexItem(itemId: string): boolean {
    const item = this._items.get(itemId);
    if (!item) return false;

    this._userIndex.get(item.userId)?.delete(itemId);
    this._mimeIndex.get(item.mimeType)?.delete(itemId);
    if (item.tags) {
      for (const tag of item.tags) {
        this._tagIndex.get(tag)?.delete(itemId);
      }
    }

    return this._items.delete(itemId);
  }

  /**
   * Queries items matching the filter specifications.
   */
  public query(filter: TrashQueryFilter): IndexedTrashItem[] {
    let candidateIds: Set<string> | null = null;

    if (filter.userId) {
      const set = this._userIndex.get(filter.userId);
      if (!set) return [];
      candidateIds = new Set(set);
    }

    if (filter.mimeType) {
      const set = this._mimeIndex.get(filter.mimeType);
      if (!set) return [];
      if (candidateIds) {
        candidateIds = new Set([...candidateIds].filter((id) => set.has(id)));
      } else {
        candidateIds = new Set(set);
      }
    }

    if (filter.tag) {
      const set = this._tagIndex.get(filter.tag);
      if (!set) return [];
      if (candidateIds) {
        candidateIds = new Set([...candidateIds].filter((id) => set.has(id)));
      } else {
        candidateIds = new Set(set);
      }
    }

    const source = candidateIds ? [...candidateIds].map((id) => this._items.get(id)!) : Array.from(this._items.values());

    return source.filter((item) => {
      if (filter.namePattern) {
        if (typeof filter.namePattern === 'string') {
          if (!item.name.toLowerCase().includes(filter.namePattern.toLowerCase())) return false;
        } else if (!filter.namePattern.test(item.name)) {
          return false;
        }
      }

      if (filter.pathPrefix && !item.originalPath.startsWith(filter.pathPrefix)) {
        return false;
      }

      if (filter.minSize !== undefined && item.size < filter.minSize) {
        return false;
      }

      if (filter.maxSize !== undefined && item.size > filter.maxSize) {
        return false;
      }

      if (filter.deletedAfter !== undefined && item.deletedAt < filter.deletedAfter) {
        return false;
      }

      if (filter.deletedBefore !== undefined && item.deletedAt > filter.deletedBefore) {
        return false;
      }

      return true;
    });
  }

  /**
   * Total number of indexed items.
   */
  public get count(): number {
    return this._items.size;
  }

  /**
   * Clears the index.
   */
  public clear(): void {
    this._items.clear();
    this._userIndex.clear();
    this._mimeIndex.clear();
    this._tagIndex.clear();
  }
}
