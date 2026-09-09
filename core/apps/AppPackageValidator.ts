/**
 * @file AppPackageValidator.ts
 * @description Application manifest schema validator and capability checker.
 */

import type { ApplicationManifest } from './types.js';

export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly severity: 'ERROR' | 'WARNING';
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export class AppPackageValidator {
  public static validate(manifest: ApplicationManifest): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 1. Validate ID format (e.g., 'app.webos.editor')
    if (!manifest.id || typeof manifest.id !== 'string') {
      issues.push({ field: 'id', message: 'Application ID is required and must be a string', severity: 'ERROR' });
    } else if (!/^[a-z0-9]+(\.[a-z0-9_-]+)+$/i.test(manifest.id)) {
      issues.push({ field: 'id', message: `Invalid application ID format: ${manifest.id}`, severity: 'ERROR' });
    }

    // 2. Validate Name
    if (!manifest.name || manifest.name.trim().length === 0) {
      issues.push({ field: 'name', message: 'Application name cannot be empty', severity: 'ERROR' });
    }

    // 3. Validate Version format (semver)
    if (!manifest.version || !/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/i.test(manifest.version)) {
      issues.push({ field: 'version', message: `Invalid semver version format: ${manifest.version}`, severity: 'ERROR' });
    }

    // 4. Validate Main Entry
    if (!manifest.main) {
      issues.push({ field: 'main', message: 'Application main entrypoint is required', severity: 'ERROR' });
    }

    return {
      valid: issues.filter(i => i.severity === 'ERROR').length === 0,
      issues: Object.freeze(issues)
    };
  }
}
