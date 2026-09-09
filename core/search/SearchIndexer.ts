/**
 * @file SearchIndexer.ts
 * @description Subscribes to EventBus file events and keeps SearchIndex synchronized.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { SearchIndex } from './SearchIndex.js';

export class SearchIndexer {
  private readonly _index: SearchIndex;
  private readonly _eventBus?: EventBus;
  private readonly _fileSystem?: FileSystem;
  private readonly _onUpdate?: () => void;
  private _unsubscribe?: () => void;

  constructor(
    index: SearchIndex,
    eventBus?: EventBus,
    fileSystem?: FileSystem,
    onUpdate?: () => void
  ) {
    this._index = index;
    this._eventBus = eventBus;
    this._fileSystem = fileSystem;
    this._onUpdate = onUpdate;
  }

  public start(): void {
    if (!this._eventBus) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      this._eventBus.subscribe('FILE_CREATED', async (e) => {
        if (this._fileSystem && e.path) {
          try {
            const stat = await this._fileSystem.stat(e.path);
            this._index.add(stat);
            this._onUpdate?.();
          } catch {}
        }
      })
    );

    unsubs.push(
      this._eventBus.subscribe('FILE_UPDATED', async (e) => {
        if (this._fileSystem && e.path) {
          try {
            const stat = await this._fileSystem.stat(e.path);
            this._index.update(stat);
            this._onUpdate?.();
          } catch {}
        }
      })
    );

    unsubs.push(
      this._eventBus.subscribe('FILE_DELETED', (e) => {
        if (e.path) {
          this._index.remove(e.path);
          this._onUpdate?.();
        }
      })
    );

    unsubs.push(
      this._eventBus.subscribe('DIRECTORY_CREATED', async (e) => {
        if (this._fileSystem && e.path) {
          try {
            const stat = await this._fileSystem.stat(e.path);
            this._index.add(stat);
            this._onUpdate?.();
          } catch {}
        }
      })
    );

    unsubs.push(
      this._eventBus.subscribe('DIRECTORY_DELETED', (e) => {
        if (e.path) {
          this._index.remove(e.path);
          this._onUpdate?.();
        }
      })
    );

    this._unsubscribe = () => {
      for (const unsub of unsubs) unsub();
    };
  }

  public stop(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }
}
