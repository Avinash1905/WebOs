/**
 * WebOS Core - Package Manager Types
 */

export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  category: 'System' | 'Development' | 'Productivity' | 'Utilities' | 'Games' | 'Media';
  icon?: string;
  bin?: Record<string, string>; // commandName -> executable script path
  dependencies?: Record<string, string>; // packageName -> semver constraint
  permissions?: string[];
  sizeKb: number;
  homepage?: string;
  verified: boolean;
}

export interface InstalledPackage {
  manifest: PackageManifest;
  installedAt: number;
  installPath: string;
  installedFiles: string[];
  status: 'active' | 'disabled' | 'broken';
}
