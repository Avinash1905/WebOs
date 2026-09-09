/**
 * @file KernelModuleLoader.ts
 * @description Dynamic kernel module loading (insmod, rmmod, lsmod) with symbol export table.
 */

export interface KernelModule {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description: string;
  readonly dependencies?: readonly string[];
  readonly init: () => Promise<void> | void;
  readonly cleanup: () => Promise<void> | void;
}

export class KernelModuleLoader {
  private readonly loadedModules = new Map<string, KernelModule>();
  private readonly exportedSymbols = new Map<string, unknown>();

  public async insertModule(mod: KernelModule): Promise<void> {
    if (this.loadedModules.has(mod.name)) {
      throw new Error(`Kernel module ${mod.name} already loaded`);
    }

    // Verify dependencies
    if (mod.dependencies) {
      for (const dep of mod.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Unresolved module dependency: ${dep} required by ${mod.name}`);
        }
      }
    }

    await Promise.resolve(mod.init());
    this.loadedModules.set(mod.name, mod);
  }

  public async removeModule(name: string): Promise<void> {
    const mod = this.loadedModules.get(name);
    if (!mod) throw new Error(`Module ${name} not loaded`);

    // Check if any other module depends on this one
    for (const [otherName, otherMod] of this.loadedModules.entries()) {
      if (otherMod.dependencies?.includes(name)) {
        throw new Error(`Cannot remove ${name}: in use by ${otherName}`);
      }
    }

    await Promise.resolve(mod.cleanup());
    this.loadedModules.delete(name);
  }

  public exportSymbol(symbolName: string, value: unknown): void {
    this.exportedSymbols.set(symbolName, value);
  }

  public getSymbol<T = unknown>(symbolName: string): T | undefined {
    return this.exportedSymbols.get(symbolName) as T | undefined;
  }

  public listModules(): readonly { name: string; version: string; description: string }[] {
    return Array.from(this.loadedModules.values()).map(m => ({
      name: m.name,
      version: m.version,
      description: m.description
    }));
  }
}
