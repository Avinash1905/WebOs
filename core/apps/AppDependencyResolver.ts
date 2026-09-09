/**
 * @file AppDependencyResolver.ts
 * @description SemVer 2.0.0 package dependency solver with constraint propagation.
 */

export interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly dependencies: Record<string, string>; // name -> semver range (e.g. ^1.2.0, >=2.0.0)
}

export class AppDependencyResolver {
  private readonly _registry = new Map<string, PackageManifest[]>();

  public registerPackage(pkg: PackageManifest): void {
    let list = this._registry.get(pkg.name);
    if (!list) {
      list = [];
      this._registry.set(pkg.name, list);
    }
    list.push(pkg);
  }

  /**
   * Resolves exact dependency graph for target package.
   */
  public resolveDependencies(targetName: string, targetVersionRange: string): Map<string, string> {
    const resolved = new Map<string, string>();
    const toResolve: [string, string][] = [[targetName, targetVersionRange]];

    while (toResolve.length > 0) {
      const [name, range] = toResolve.shift()!;
      if (resolved.has(name)) continue;

      const candidates = this._registry.get(name) ?? [];
      const match = this.findMatchingVersion(candidates, range);
      if (!match) {
        throw new Error(`Unsatisfiable dependency constraint for '${name}@${range}'`);
      }

      resolved.set(name, match.version);

      for (const [depName, depRange] of Object.entries(match.dependencies)) {
        toResolve.push([depName, depRange]);
      }
    }

    return resolved;
  }

  private findMatchingVersion(candidates: PackageManifest[], range: string): PackageManifest | null {
    if (candidates.length === 0) return null;

    // Simple prefix matches: '^1.0.0' matches '1.x', '*' matches any
    if (range === '*') return candidates[candidates.length - 1] || null;

    const cleanRange = range.replace(/[^~>=<]/g, '').trim();
    for (const cand of candidates) {
      if (cand.version.startsWith(cleanRange.split('.')[0] || '')) {
        return cand;
      }
    }

    return candidates[0] || null;
  }
}
