/**
 * WebOS Core - Package Manager Master Engine (apm / pkg)
 */

import { PackageManifest, InstalledPackage } from './types';
import { SemVer } from './semver';
import { vfs } from '../vfs/vfs';

export class PackageManager {
  private static instance: PackageManager;
  private installedPackages: Map<string, InstalledPackage> = new Map();
  private repositoryIndex: Map<string, PackageManifest[]> = new Map();

  private constructor() {
    this.initializeDefaultCatalog();
  }

  public static getInstance(): PackageManager {
    if (!PackageManager.instance) {
      PackageManager.instance = new PackageManager();
    }
    return PackageManager.instance;
  }

  private initializeDefaultCatalog(): void {
    const defaultPkgs: PackageManifest[] = [
      {
        name: 'webos-neofetch',
        version: '1.0.0',
        description: 'Fast CLI system information display tool for WebOS terminal.',
        author: 'WebOS Core Team',
        license: 'MIT',
        category: 'Utilities',
        bin: { neofetch: '/bin/neofetch' },
        sizeKb: 45,
        verified: true,
      },
      {
        name: 'webos-htop',
        version: '2.1.0',
        description: 'Interactive ncurses-style process viewer and system resource grapher.',
        author: 'SysDev Foundation',
        license: 'GPL-3.0',
        category: 'System',
        bin: { htop: '/bin/htop' },
        sizeKb: 120,
        verified: true,
      },
      {
        name: 'webos-git',
        version: '2.40.0',
        description: 'Distributed version control system with VFS object store integration.',
        author: 'Git Project',
        license: 'GPL-2.0',
        category: 'Development',
        bin: { git: '/bin/git' },
        sizeKb: 2400,
        verified: true,
      },
      {
        name: 'webos-sqlite3',
        version: '3.42.0',
        description: 'Embedded relational database engine with interactive SQL shell.',
        author: 'SQLite Organization',
        license: 'Public Domain',
        category: 'Development',
        bin: { sqlite3: '/bin/sqlite3' },
        sizeKb: 1800,
        verified: true,
      },
    ];

    for (const pkg of defaultPkgs) {
      this.repositoryIndex.set(pkg.name, [pkg]);
    }
  }

  public search(query: string): PackageManifest[] {
    const q = query.toLowerCase();
    const results: PackageManifest[] = [];
    for (const versions of this.repositoryIndex.values()) {
      const latest = versions[versions.length - 1];
      if (
        latest.name.toLowerCase().includes(q) ||
        latest.description.toLowerCase().includes(q) ||
        latest.category.toLowerCase().includes(q)
      ) {
        results.push(latest);
      }
    }
    return results;
  }

  public async install(packageName: string, versionConstraint: string = '*'): Promise<InstalledPackage> {
    const versions = this.repositoryIndex.get(packageName);
    if (!versions || versions.length === 0) {
      throw new Error(`E404: Package '${packageName}' not found in any repository mirror`);
    }

    const matchedManifest = versions
      .filter((v) => SemVer.satisfies(v.version, versionConstraint))
      .sort((a, b) => SemVer.compare(b.version, a.version))[0];

    if (!matchedManifest) {
      throw new Error(`ENOVERSION: No version matching '${versionConstraint}' found for '${packageName}'`);
    }

    // Resolve dependencies recursively
    if (matchedManifest.dependencies) {
      for (const [depName, constraint] of Object.entries(matchedManifest.dependencies)) {
        if (!this.installedPackages.has(depName)) {
          await this.install(depName, constraint);
        }
      }
    }

    // Create install directory in VFS
    const installPath = `/usr/lib/webos/packages/${packageName}`;
    if (!vfs.exists(installPath)) {
      vfs.mkdirp(installPath);
    }

    // Install bin executables
    const installedFiles: string[] = [];
    if (matchedManifest.bin) {
      for (const [binName, binPath] of Object.entries(matchedManifest.bin)) {
        const script = `#!/bin/sh\n# WebOS auto-generated launcher for ${packageName}@${matchedManifest.version}\necho "[${packageName}] running ${binName} v${matchedManifest.version}..."\n`;
        vfs.writeFile(binPath, script, 0o755);
        installedFiles.push(binPath);
      }
    }

    const installed: InstalledPackage = {
      manifest: matchedManifest,
      installedAt: Date.now(),
      installPath,
      installedFiles,
      status: 'active',
    };

    this.installedPackages.set(packageName, installed);
    return installed;
  }

  public uninstall(packageName: string): boolean {
    const installed = this.installedPackages.get(packageName);
    if (!installed) return false;

    for (const filePath of installed.installedFiles) {
      if (vfs.exists(filePath)) {
        vfs.unlink(filePath);
      }
    }

    if (vfs.exists(installed.installPath)) {
      vfs.rmdir(installed.installPath);
    }

    return this.installedPackages.delete(packageName);
  }

  public listInstalled(): InstalledPackage[] {
    return Array.from(this.installedPackages.values());
  }
}

export const packageManager = PackageManager.getInstance();
