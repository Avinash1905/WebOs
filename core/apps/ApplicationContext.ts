/**
 * @file ApplicationContext.ts
 * @description Sandboxed execution context factory for running WebOS application instances.
 */

import type {
  IApplicationContext,
  IApplicationStorage,
  IApplicationFS,
  IApplicationClipboard,
  IApplicationLogger,
  ApplicationManifest,
  ApplicationRuntimeDependencies,
} from './types.js';
import { assertAppPermission } from './AppPermission.js';

export class ScopedApplicationStorage implements IApplicationStorage {
  private readonly prefix: string;
  private readonly storage?: ApplicationRuntimeDependencies['storage'];

  constructor(appId: string, storage?: ApplicationRuntimeDependencies['storage']) {
    this.prefix = `app:${appId}:`;
    this.storage = storage;
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.storage) return null;
    const val = await this.storage.get<T>(this.prefix + key);
    return val !== undefined ? val : null;
  }

  public async set<T = any>(key: string, value: T): Promise<void> {
    if (!this.storage) return;
    await this.storage.set<T>(this.prefix + key, value);
  }

  public async remove(key: string): Promise<void> {
    if (!this.storage) return;
    await this.storage.delete(this.prefix + key);
  }

  public async clear(): Promise<void> {
    if (!this.storage) return;
    const keys = await this.keys();
    for (const k of keys) {
      await this.storage.delete(this.prefix + k);
    }
  }

  public async keys(): Promise<string[]> {
    if (!this.storage) return [];
    const allKeys = await this.storage.keys();
    return allKeys
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }
}

export class ApplicationContextFactory {
  public static create(
    appId: string,
    instanceId: string,
    processId: number,
    userId: string,
    manifest: ApplicationManifest,
    launchArgs: Record<string, any>,
    deps: ApplicationRuntimeDependencies,
    callbacks: {
      onClose: () => Promise<void>;
      onPause: (cb: () => void) => () => void;
      onResume: (cb: () => void) => () => void;
      onDestroy: (cb: () => void | Promise<void>) => () => void;
    }
  ): IApplicationContext {
    const storage = new ScopedApplicationStorage(appId, deps.storage);

    const fs: IApplicationFS = {
      readFile: async (path: string): Promise<string> => {
        assertAppPermission(manifest, 'filesystem:read');
        if (!deps.filesystem) throw new Error('FileSystem is not available');
        const fileContext = { userId, processId };
        const content = await deps.filesystem.readFile(path, { encoding: 'utf-8' }, fileContext);
        return typeof content === 'string' ? content : String(content);
      },
      writeFile: async (path: string, content: string): Promise<void> => {
        assertAppPermission(manifest, 'filesystem:write');
        if (!deps.filesystem) throw new Error('FileSystem is not available');
        const fileContext = { userId, processId };
        await deps.filesystem.writeFile(path, content, undefined, fileContext);
      },
      exists: async (path: string): Promise<boolean> => {
        assertAppPermission(manifest, 'filesystem:read');
        if (!deps.filesystem) return false;
        return deps.filesystem.exists(path);
      },
      deleteFile: async (path: string): Promise<void> => {
        assertAppPermission(manifest, 'filesystem:write');
        if (!deps.filesystem) throw new Error('FileSystem is not available');
        const fileContext = { userId, processId };
        await deps.filesystem.delete(path, undefined, fileContext);
      },
    };

    const clipboard: IApplicationClipboard = {
      readText: async (): Promise<string> => {
        assertAppPermission(manifest, 'clipboard:read');
        if (!deps.clipboardManager) throw new Error('ClipboardManager is not available');
        return deps.clipboardManager.readText({ userId });
      },
      writeText: async (text: string): Promise<void> => {
        assertAppPermission(manifest, 'clipboard:write');
        if (!deps.clipboardManager) throw new Error('ClipboardManager is not available');
        await deps.clipboardManager.writeText(text, { userId });
      },
    };

    const log: IApplicationLogger = {
      info: (msg: string, ...args: any[]) => {
        console.log(`[${manifest.name}:${instanceId.slice(0, 8)}] INFO:`, msg, ...args);
      },
      warn: (msg: string, ...args: any[]) => {
        console.warn(`[${manifest.name}:${instanceId.slice(0, 8)}] WARN:`, msg, ...args);
      },
      error: (msg: string, ...args: any[]) => {
        console.error(`[${manifest.name}:${instanceId.slice(0, 8)}] ERROR:`, msg, ...args);
      },
    };

    const context: IApplicationContext = {
      appId,
      instanceId,
      processId,
      userId,
      manifest,
      storage,
      fs,
      clipboard,
      log,

      getLaunchArgs: <T = Record<string, any>>(): T => {
        return { ...launchArgs } as unknown as T;
      },

      close: async () => {
        await callbacks.onClose();
      },

      emit: (event: string, payload?: any) => {
        if (deps.eventBus) {
          deps.eventBus.emit(event as any, {
            appId,
            instanceId,
            processId,
            userId,
            payload,
            timestamp: Date.now(),
          } as any);
        }
      },

      on: (event: string, handler: (payload: any) => void): (() => void) => {
        if (!deps.eventBus) {
          return () => {};
        }
        return deps.eventBus.subscribe(event as any, handler);
      },

      onPause: (cb: () => void) => callbacks.onPause(cb),
      onResume: (cb: () => void) => callbacks.onResume(cb),
      onDestroy: (cb: () => void | Promise<void>) => callbacks.onDestroy(cb),
    };

    return context;
  }
}
