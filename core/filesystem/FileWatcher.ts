/**
 * @file FileWatcher.ts
 * @description File watcher management and event routing for WebOS VFS.
 */

import { PathResolver } from './PathResolver.js';
import type { FileWatcherCallback, FileWatcherEvent } from './types.js';

interface WatcherRecord {
  readonly id: string;
  readonly path: string;
  readonly recursive: boolean;
  readonly callback: FileWatcherCallback;
}

let watcherCounter = 0;

/**
 * Manages path and directory watcher subscriptions and dispatches filesystem change events.
 */
export class FileWatcherManager {
  private readonly _watchers: WatcherRecord[] = [];

  /**
   * Subscribes a callback to changes at a specific path or subtree.
   *
   * @param targetPath - The path to watch.
   * @param callback - Function invoked on changes.
   * @param options - Watch options (recursive: defaults to true for directories).
   * @returns Unsubscribe function.
   */
  public watch(
    targetPath: string,
    callback: FileWatcherCallback,
    options?: { recursive?: boolean }
  ): () => void {
    const normalized = PathResolver.normalize(targetPath);
    const record: WatcherRecord = {
      id: `watcher_${Date.now()}_${++watcherCounter}`,
      path: normalized,
      recursive: options?.recursive ?? true,
      callback,
    };

    this._watchers.push(record);

    return () => {
      const idx = this._watchers.indexOf(record);
      if (idx !== -1) {
        this._watchers.splice(idx, 1);
      }
    };
  }

  /**
   * Dispatches a filesystem change event to all matching watchers.
   */
  public notify(event: FileWatcherEvent): void {
    for (const watcher of [...this._watchers]) {
      const isDirectMatch =
        watcher.path === event.path ||
        (event.oldPath !== undefined && watcher.path === event.oldPath) ||
        (event.newPath !== undefined && watcher.path === event.newPath);

      const isParentMatch =
        watcher.recursive &&
        (PathResolver.isSubpath(watcher.path, event.path) ||
          (event.oldPath !== undefined && PathResolver.isSubpath(watcher.path, event.oldPath)) ||
          (event.newPath !== undefined && PathResolver.isSubpath(watcher.path, event.newPath)));

      if (isDirectMatch || isParentMatch) {
        try {
          const result = watcher.callback(event);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(`[FileWatcher] Async watcher error on '${watcher.path}':`, err);
            });
          }
        } catch (err) {
          console.error(`[FileWatcher] Error in file watcher on '${watcher.path}':`, err);
        }
      }
    }
  }

  /**
   * Clears all active watchers.
   */
  public clear(): void {
    this._watchers.length = 0;
  }
}
