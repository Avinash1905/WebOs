/**
 * @file webosPlatform.ts
 * @description Central platform service bridge initializing and providing access to WebOS core services.
 */

import { Kernel } from '../../core/kernel/Kernel.js';
import { EventBus } from '../../core/events/EventBus.js';
import { StorageEngine } from '../../core/storage/StorageEngine.js';
import { FileSystem } from '../../core/filesystem/FileSystem.js';

export interface ClipboardItem {
  paths: string[];
  action: 'copy' | 'cut';
  timestamp: number;
}

export class WebOSPlatformService {
  private static instance: WebOSPlatformService | null = null;

  public readonly kernel: Kernel;
  public readonly eventBus: EventBus;
  public readonly storage: StorageEngine;
  public readonly fileSystem: FileSystem;
  
  private clipboardData: ClipboardItem | null = null;
  private isInitialized = false;

  private constructor() {
    this.kernel = new Kernel();
    this.eventBus = new EventBus();
    this.storage = new StorageEngine({ eventBus: this.eventBus });
    this.fileSystem = new FileSystem({ storage: this.storage, eventBus: this.eventBus });

    this.kernel.registerService(this.eventBus);
    this.kernel.registerService(this.storage);
    this.kernel.registerService(this.fileSystem);

    this.eventBus.attachToKernel(this.kernel);
  }

  public static getInstance(): WebOSPlatformService {
    if (!WebOSPlatformService.instance) {
      WebOSPlatformService.instance = new WebOSPlatformService();
    }
    return WebOSPlatformService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      if (this.kernel.getStatus() === 'CREATED') {
        await this.kernel.initialize();
        await this.kernel.start();
      }

      // Ensure standard system directories exist
      await this.ensureDirectoryStructure();
      this.isInitialized = true;
    } catch (err) {
      console.warn('[WebOSPlatform] Initialization warning:', err);
    }
  }

  private async ensureDirectoryStructure(): Promise<void> {
    const dirs = [
      '/home',
      '/home/user',
      '/home/user/Desktop',
      '/home/user/Documents',
      '/home/user/Downloads',
      '/home/user/Pictures',
      '/home/user/Notes',
      '/trash',
    ];

    for (const dir of dirs) {
      if (!(await this.fileSystem.exists(dir))) {
        await this.fileSystem.createDirectory(dir);
      }
    }
  }

  // Clipboard operations
  public setClipboard(paths: string[], action: 'copy' | 'cut'): void {
    this.clipboardData = { paths, action, timestamp: Date.now() };
  }

  public getClipboard(): ClipboardItem | null {
    return this.clipboardData;
  }

  public clearClipboard(): void {
    this.clipboardData = null;
  }
}

export const platform = WebOSPlatformService.getInstance();
