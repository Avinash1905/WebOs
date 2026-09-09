/**
 * @file TrashManager.ts
 * @description Central Trash and Recovery Engine for WebOS.
 */

import type { EventBus } from '../events/index.js';
import type { FileMetadata, FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/Service.js';
import { type NamespaceStorage, StorageEngine } from '../storage/index.js';
import { TrashItemNotFoundError } from './TrashError.js';
import type {
  RestoreOptions,
  TrashEntry,
  TrashManagerConfig,
  TrashStats,
} from './types.js';

let trashCounter = 0;

function generateTrashId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `trash_${Date.now()}_${++trashCounter}_${rand}`;
}

/**
 * WebOS Trash & Recovery Service.
 */
export class TrashManager extends BaseSystemService {
  public override readonly name = 'trash';
  public override readonly dependencies: readonly string[] = ['storage'];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'filesystem',
  ];

  private readonly _trashEntries = new Map<string, TrashEntry>(); // trashId -> TrashEntry

  private _storageEngine?: StorageEngine;
  private _metaStorage?: NamespaceStorage;
  private _contentStorage?: NamespaceStorage;
  private _eventBus?: EventBus;
  private _fileSystem?: FileSystem;

  constructor(config?: TrashManagerConfig) {
    super();
    this._eventBus = config?.eventBus;
    this._fileSystem = config?.fileSystem;

    if (config?.storage) {
      this.attachStorage(config.storage);
    }
  }

  /**
   * Attaches the StorageEngine for persistence.
   */
  public attachStorage(storage: StorageEngine): void {
    this._storageEngine = storage;
    this._metaStorage = storage.namespace('trash_meta');
    this._contentStorage = storage.namespace('trash_content');
  }

  /**
   * Attaches the EventBus instance.
   */
  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  /**
   * Attaches the FileSystem instance.
   */
  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  // =========================================================================
  // Service Lifecycle
  // =========================================================================

  protected override async onInitialize(): Promise<void> {
    if (!this._storageEngine) {
      this.attachStorage(new StorageEngine());
    }

    if (this._storageEngine) {
      await this._storageEngine.initialize();
    }

    if (this._metaStorage) {
      const keys = await this._metaStorage.keys();
      if (keys.length > 0) {
        const persisted = await this._metaStorage.getMany<TrashEntry>(keys);
        for (const entry of persisted.values()) {
          if (entry && entry.trashId) {
            this._trashEntries.set(entry.trashId, entry);
          }
        }
      }
    }
  }

  protected override async onStop(): Promise<void> {
    this._trashEntries.clear();
  }

  // =========================================================================
  // Trash Operations
  // =========================================================================

  /**
   * Moves a file or directory into the trash system.
   */
  public async moveToTrash(
    path: string,
    options?: { deletedBy?: string }
  ): Promise<TrashEntry> {
    if (!this._fileSystem) {
      throw new Error('FileSystem is not attached to TrashManager');
    }

    const stat = await this._fileSystem.stat(path);
    const trashId = generateTrashId();
    const now = Date.now();
    const deletedBy = options?.deletedBy ?? 'user';

    let contentKey: string | undefined;

    // 1. If it's a file, backup content
    if (stat.type === 'file') {
      contentKey = `content_${trashId}`;
      const content = await this._fileSystem.readFile(path, { encoding: 'binary' });
      if (this._contentStorage) {
        await this._contentStorage.set(contentKey, content);
      }
    }

    const trashEntry: TrashEntry = {
      trashId,
      originalPath: stat.path,
      originalName: stat.name,
      nodeType: stat.type,
      deletedAt: now,
      deletedBy,
      size: stat.size,
      metadata: Object.freeze({ ...stat }),
      contentKey,
    };

    // 2. Cache & persist metadata
    this._trashEntries.set(trashId, trashEntry);
    if (this._metaStorage) {
      await this._metaStorage.set(trashId, trashEntry);
    }

    // 3. Remove node from active VFS without sending to trash again
    await this._fileSystem.delete(path, {
      recursive: true,
      useTrash: false,
    });

    if (this._eventBus) {
      this._eventBus.emit(
        'FILE_DELETED',
        { path: stat.path },
        { source: 'trash' }
      );
    }

    return trashEntry;
  }

  /**
   * Restores an item from trash back to the filesystem.
   */
  public async restore(
    trashId: string,
    options?: RestoreOptions
  ): Promise<FileMetadata> {
    if (!this._fileSystem) {
      throw new Error('FileSystem is not attached to TrashManager');
    }

    const entry = this._trashEntries.get(trashId);
    if (!entry) {
      throw new TrashItemNotFoundError(trashId);
    }

    const destinationPath = options?.destinationPath ?? entry.originalPath;

    let restoredNode: FileMetadata;

    if (entry.nodeType === 'directory') {
      restoredNode = await this._fileSystem.createDirectory(destinationPath, {
        recursive: true,
      });
    } else {
      let content: unknown = '';
      if (entry.contentKey && this._contentStorage) {
        content = (await this._contentStorage.get(entry.contentKey)) ?? '';
      }
      restoredNode = await this._fileSystem.createFile(destinationPath, {
        content: content as string | Uint8Array,
        overwrite: options?.overwrite ?? true,
      });
    }

    // Purge from trash
    await this.purgeTrash(trashId);

    if (this._eventBus) {
      this._eventBus.emit(
        'FILE_CREATED',
        { path: restoredNode.path, size: restoredNode.size },
        { source: 'trash' }
      );
    }

    return restoredNode;
  }

  /**
   * Lists all items currently in the trash.
   */
  public async listTrash(): Promise<TrashEntry[]> {
    return Array.from(this._trashEntries.values());
  }

  /**
   * Retrieves a single trash item by its trashId.
   */
  public async getTrashEntry(trashId: string): Promise<TrashEntry | null> {
    return this._trashEntries.get(trashId) ?? null;
  }

  /**
   * Permanently deletes a single item from the trash.
   */
  public async purgeTrash(trashId: string): Promise<void> {
    const entry = this._trashEntries.get(trashId);
    if (!entry) {
      throw new TrashItemNotFoundError(trashId);
    }

    if (entry.contentKey && this._contentStorage) {
      await this._contentStorage.delete(entry.contentKey);
    }

    this._trashEntries.delete(trashId);

    if (this._metaStorage) {
      await this._metaStorage.delete(trashId);
    }
  }

  /**
   * Empties all items from the trash permanently.
   */
  public async emptyTrash(): Promise<void> {
    if (this._trashEntries.size === 0) {
      return;
    }

    for (const trashId of Array.from(this._trashEntries.keys())) {
      await this.purgeTrash(trashId);
    }
  }

  /**
   * Returns current trash statistics.
   */
  public async getTrashStats(): Promise<TrashStats> {
    let totalBytes = 0;
    let oldest: number | undefined;

    for (const entry of this._trashEntries.values()) {
      totalBytes += entry.size;
      if (oldest === undefined || entry.deletedAt < oldest) {
        oldest = entry.deletedAt;
      }
    }

    return {
      totalItems: this._trashEntries.size,
      totalBytes,
      oldestItemTimestamp: oldest,
    };
  }
}
