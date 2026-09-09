/**
 * @file ApplicationRegistry.ts
 * @description In-memory registry for installed and registered WebOS applications.
 */

import type { ApplicationManifest, AppFilter } from './types.js';
import { validateManifest } from './ApplicationManifest.js';
import { AppAlreadyRegisteredError, AppNotFoundError } from './ApplicationError.js';

export class ApplicationRegistry {
  private readonly manifests = new Map<string, ApplicationManifest>();

  public register(manifestInput: ApplicationManifest): ApplicationManifest {
    const validated = validateManifest(manifestInput);

    if (this.manifests.has(validated.id)) {
      throw new AppAlreadyRegisteredError(validated.id);
    }

    this.manifests.set(validated.id, validated);
    return validated;
  }

  public unregister(appId: string): boolean {
    if (!this.manifests.has(appId)) {
      throw new AppNotFoundError(appId);
    }
    return this.manifests.delete(appId);
  }

  public get(appId: string): ApplicationManifest | undefined {
    return this.manifests.get(appId);
  }

  public getOrThrow(appId: string): ApplicationManifest {
    const manifest = this.manifests.get(appId);
    if (!manifest) {
      throw new AppNotFoundError(appId);
    }
    return manifest;
  }

  public has(appId: string): boolean {
    return this.manifests.has(appId);
  }

  public getAll(): ApplicationManifest[] {
    return Array.from(this.manifests.values());
  }

  public findByExtension(extension: string): ApplicationManifest[] {
    const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    return this.getAll().filter((m) =>
      m.fileExtensions?.some((ext) => ext.toLowerCase() === normalizedExt)
    );
  }

  public findByCategory(category: string): ApplicationManifest[] {
    const norm = category.toLowerCase();
    return this.getAll().filter((m) => m.category?.toLowerCase() === norm);
  }

  public filter(filter: AppFilter): ApplicationManifest[] {
    return this.getAll().filter((m) => {
      if (filter.category && m.category?.toLowerCase() !== filter.category.toLowerCase()) {
        return false;
      }
      if (filter.systemApp !== undefined && !!m.systemApp !== filter.systemApp) {
        return false;
      }
      if (filter.fileExtension) {
        const normExt = filter.fileExtension.startsWith('.') ? filter.fileExtension.toLowerCase() : `.${filter.fileExtension.toLowerCase()}`;
        if (!m.fileExtensions?.some((ext) => ext.toLowerCase() === normExt)) {
          return false;
        }
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        const matchDesc = m.description?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchId && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }

  public count(): number {
    return this.manifests.size;
  }

  public clear(): void {
    this.manifests.clear();
  }
}
