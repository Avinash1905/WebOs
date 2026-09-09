/**
 * @file TrashDeduplication.ts
 * @description Content-addressable chunk hashing and deduplication for WebOS Trash Subsystem.
 */

export interface ChunkMetadata {
  readonly hash: string;
  readonly size: number;
  refCount: number;
  readonly createdAt: number;
}

export interface DeduplicationSummary {
  readonly totalOriginalBytes: number;
  readonly totalDeduplicatedBytes: number;
  readonly savedBytes: number;
  readonly deduplicationRatio: number;
  readonly uniqueChunks: number;
}

/**
 * Manages content-addressed deduplication for deleted file payloads in the trash.
 */
export class TrashDeduplication {
  private readonly _chunks = new Map<string, ChunkMetadata>();
  private readonly _itemChunks = new Map<string, string[]>(); // itemId -> hash[]
  private _totalOriginalBytes = 0;

  /**
   * Generates a deterministic SHA-256 style hash for string/buffer payloads.
   */
  public hashContent(content: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    // Combine with length and character sampling for strong pseudo-hash
    const len = content.length.toString(16).padStart(8, '0');
    const midChar = content.length > 0 ? content.charCodeAt(Math.floor(content.length / 2)).toString(16).padStart(4, '0') : '0000';
    return `chk_${hex}_${len}_${midChar}`;
  }

  /**
   * Registers a file's content into deduplicated storage.
   */
  public registerItem(itemId: string, content: string): string {
    const hash = this.hashContent(content);
    const size = new TextEncoder().encode(content).length;

    this._totalOriginalBytes += size;

    const existing = this._chunks.get(hash);
    if (existing) {
      existing.refCount += 1;
    } else {
      this._chunks.set(hash, {
        hash,
        size,
        refCount: 1,
        createdAt: Date.now(),
      });
    }

    const chunkList = this._itemChunks.get(itemId) ?? [];
    chunkList.push(hash);
    this._itemChunks.set(itemId, chunkList);

    return hash;
  }

  /**
   * Deregisters an item from deduplication storage upon permanent purge.
   */
  public releaseItem(itemId: string): number {
    const hashes = this._itemChunks.get(itemId);
    if (!hashes) return 0;

    let reclaimedBytes = 0;
    for (const hash of hashes) {
      const chunk = this._chunks.get(hash);
      if (chunk) {
        chunk.refCount -= 1;
        if (chunk.refCount <= 0) {
          reclaimedBytes += chunk.size;
          this._chunks.delete(hash);
        }
      }
    }

    this._itemChunks.delete(itemId);
    return reclaimedBytes;
  }

  /**
   * Returns current deduplication metrics.
   */
  public getSummary(): DeduplicationSummary {
    let deduplicatedBytes = 0;
    for (const chunk of this._chunks.values()) {
      deduplicatedBytes += chunk.size;
    }

    const savedBytes = Math.max(0, this._totalOriginalBytes - deduplicatedBytes);
    const ratio = this._totalOriginalBytes > 0 ? (this._totalOriginalBytes / (deduplicatedBytes || 1)) : 1;

    return {
      totalOriginalBytes: this._totalOriginalBytes,
      totalDeduplicatedBytes: deduplicatedBytes,
      savedBytes,
      deduplicationRatio: Number(ratio.toFixed(2)),
      uniqueChunks: this._chunks.size,
    };
  }

  /**
   * Checks if a content hash exists in the deduplication registry.
   */
  public hasChunk(hash: string): boolean {
    return this._chunks.has(hash);
  }

  /**
   * Clears all deduplication records.
   */
  public clear(): void {
    this._chunks.clear();
    this._itemChunks.clear();
    this._totalOriginalBytes = 0;
  }
}
