/**
 * @file ClipboardManager.ts
 * @description WebOS Clipboard Management System Service with VFS file operations and history.
 */

import type { EventBus } from '../events/index.js';
import type { FileSystem } from '../filesystem/index.js';
import { BaseSystemService } from '../kernel/index.js';
import type { PermissionManager, SecurityContext } from '../permissions/index.js';
import type { StorageEngine } from '../storage/index.js';
import {
  ClipboardOperationError,
  EmptyClipboardError,
  InvalidClipboardDataError,
} from './ClipboardError.js';
import { ClipboardHistory } from './ClipboardHistory.js';
import type {
  ClipboardConfig,
  ClipboardDataType,
  ClipboardItem,
  PasteOptions,
  SetClipboardOptions,
} from './types.js';

let itemCounter = 0;

export class ClipboardManager extends BaseSystemService {
  public override readonly name = 'clipboard';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [
    'event-bus',
    'storage',
    'filesystem',
    'permissions',
  ];

  private _currentItem: ClipboardItem<unknown> | null = null;
  private readonly _history: ClipboardHistory;

  private _fileSystem?: FileSystem;
  private _eventBus?: EventBus;
  public permissionManager?: PermissionManager;
  public storageEngine?: StorageEngine;

  constructor(config?: ClipboardConfig) {
    super();
    this._history = new ClipboardHistory(config?.maxHistorySize ?? 20);
    this._eventBus = config?.eventBus;
    this._fileSystem = config?.fileSystem;
    this.permissionManager = config?.permissionManager;
    this.storageEngine = config?.storage;
  }

  // =========================================================================
  // Service Attachments
  // =========================================================================

  public attachEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
  }

  public attachFileSystem(fileSystem: FileSystem): void {
    this._fileSystem = fileSystem;
  }

  public attachPermissionManager(permissionManager: PermissionManager): void {
    this.permissionManager = permissionManager;
  }

  public attachStorage(storage: StorageEngine): void {
    this.storageEngine = storage;
  }

  // =========================================================================
  // Core Clipboard Operations
  // =========================================================================

  public set<T = unknown>(
    type: ClipboardDataType,
    value: T,
    options?: SetClipboardOptions,
    context?: Partial<SecurityContext>
  ): ClipboardItem<T> {
    if (value === undefined || value === null) {
      throw new InvalidClipboardDataError('Clipboard value cannot be null or undefined');
    }

    const item: ClipboardItem<T> = {
      id: 'clip_' + Date.now() + '_' + (++itemCounter),
      type,
      value,
      operation: options?.operation ?? 'copy',
      sourcePath: options?.sourcePath,
      sourceApp: options?.sourceApp,
      userId: options?.userId ?? context?.userId,
      sessionId: options?.sessionId,
      timestamp: Date.now(),
      metadata: options?.metadata ? Object.freeze({ ...options.metadata }) : undefined,
    };

    this._currentItem = item as ClipboardItem<unknown>;
    this._history.add(this._currentItem);

    if (this._eventBus) {
      this._eventBus.emit('CLIPBOARD_CHANGED', {
        type: item.type,
        sourceApp: item.sourceApp,
        userId: item.userId,
        timestamp: item.timestamp,
      });

      if (item.operation === 'copy') {
        this._eventBus.emit('CLIPBOARD_COPIED', {
          type: item.type,
          sourcePath: item.sourcePath,
          sourceApp: item.sourceApp,
        });
      } else if (item.operation === 'cut') {
        this._eventBus.emit('CLIPBOARD_CUT', {
          type: item.type,
          sourcePath: item.sourcePath,
          sourceApp: item.sourceApp,
        });
      }
    }

    return item;
  }

  public get<T = unknown>(_context?: Partial<SecurityContext>): ClipboardItem<T> | null {
    return (this._currentItem as ClipboardItem<T>) ?? null;
  }

  public copy<T = unknown>(
    type: ClipboardDataType,
    value: T,
    options?: SetClipboardOptions,
    context?: Partial<SecurityContext>
  ): ClipboardItem<T> {
    return this.set(type, value, { ...options, operation: 'copy' }, context);
  }

  public cut<T = unknown>(
    type: ClipboardDataType,
    value: T,
    options?: SetClipboardOptions,
    context?: Partial<SecurityContext>
  ): ClipboardItem<T> {
    return this.set(type, value, { ...options, operation: 'cut' }, context);
  }

  public async readText(_context?: Partial<SecurityContext>): Promise<string> {
    if (!this._currentItem) return '';
    return typeof this._currentItem.value === 'string' ? this._currentItem.value : String(this._currentItem.value);
  }

  public async writeText(text: string, context?: Partial<SecurityContext>): Promise<ClipboardItem<string>> {
    return this.set('text', text, { operation: 'copy' }, context);
  }

  public async paste(
    destinationPath?: string,
    options?: PasteOptions,
    context?: Partial<SecurityContext>
  ): Promise<unknown> {
    if (!this._currentItem) {
      throw new EmptyClipboardError();
    }

    const item = this._currentItem;
    const isCut = item.operation === 'cut';

    // 1. Text or Custom data paste
    if (item.type === 'text' || item.type === 'custom') {
      if (destinationPath && this._fileSystem) {
        await this._fileSystem.writeFile(
          destinationPath,
          String(item.value),
          undefined,
          context
        );
      }

      if (isCut) {
        this.clear(context);
      }

      if (this._eventBus) {
        this._eventBus.emit('CLIPBOARD_PASTED', {
          type: item.type,
          destinationPath,
          operation: item.operation,
          targetApp: options?.targetApp,
        });
      }

      return item.value;
    }

    // 2. VFS File / Directory paste
    if (!destinationPath) {
      return item.value;
    }

    if (!this._fileSystem) {
      throw new ClipboardOperationError('paste', 'FileSystem service not attached to ClipboardManager');
    }

    const sourcePath = item.sourcePath ?? (typeof item.value === 'string' ? item.value : null);

    if (item.type === 'file' || item.type === 'directory') {
      if (!sourcePath) {
        throw new InvalidClipboardDataError('No source path associated with file/directory clipboard item');
      }

      if (isCut) {
        await this._fileSystem.move(sourcePath, destinationPath, context);
        this.clear(context);
      } else {
        await this._fileSystem.copy(
          sourcePath,
          destinationPath,
          { overwrite: options?.overwrite },
          context
        );
      }

      if (this._eventBus) {
        this._eventBus.emit('CLIPBOARD_PASTED', {
          type: item.type,
          sourcePath,
          destinationPath,
          operation: item.operation,
          targetApp: options?.targetApp,
        });
      }

      return destinationPath;
    }

    // 3. Multi-file paste
    if (item.type === 'files' && Array.isArray(item.value)) {
      const paths = item.value as string[];
      const results: string[] = [];

      for (const p of paths) {
        const dest = destinationPath.endsWith('/')
          ? destinationPath + p.split('/').pop()
          : destinationPath + '/' + p.split('/').pop();

        if (isCut) {
          await this._fileSystem.move(p, dest, context);
        } else {
          await this._fileSystem.copy(p, dest, { overwrite: options?.overwrite }, context);
        }
        results.push(dest);
      }

      if (isCut) {
        this.clear(context);
      }

      if (this._eventBus) {
        this._eventBus.emit('CLIPBOARD_PASTED', {
          type: 'files',
          destinationPath,
          operation: item.operation,
          targetApp: options?.targetApp,
        });
      }

      return results;
    }

    return item.value;
  }

  public clear(_context?: Partial<SecurityContext>): void {
    this._currentItem = null;
    if (this._eventBus) {
      this._eventBus.emit('CLIPBOARD_CLEARED', {
        timestamp: Date.now(),
      });
    }
  }

  public isEmpty(): boolean {
    return this._currentItem === null;
  }

  public getHistory(): readonly ClipboardItem<unknown>[] {
    return this._history.getAll();
  }

  public clearHistory(): void {
    this._history.clear();
  }

  public getHistoryItem(id: string): ClipboardItem<unknown> | null {
    return this._history.get(id);
  }

  public restoreFromHistory(id: string, context?: Partial<SecurityContext>): ClipboardItem<unknown> | null {
    const item = this._history.get(id);
    if (!item) return null;
    return this.set(item.type, item.value, {
      operation: item.operation,
      sourcePath: item.sourcePath,
      sourceApp: item.sourceApp,
      userId: item.userId,
      sessionId: item.sessionId,
      metadata: item.metadata as Record<string, unknown>,
    }, context);
  }

  protected override async onInitialize(): Promise<void> {
    this.clear();
    this.clearHistory();
  }

  protected override async onStop(): Promise<void> {
    this.clear();
  }
}
