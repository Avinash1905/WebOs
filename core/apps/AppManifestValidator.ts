/**
 * @file AppManifestValidator.ts
 * @description WebOS application manifest schema validator and integrity verifier.
 */

export interface AppManifestSchema {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
  permissions?: string[];
  icon?: string;
  mimeAssociations?: string[];
}

export class AppManifestValidator {
  public static validate(manifest: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be a non-null object'] };
    }

    const m = manifest as Partial<AppManifestSchema>;

    if (!m.id || typeof m.id !== 'string' || !/^[a-z0-9._-]+$/.test(m.id)) {
      errors.push('Manifest "id" must be a valid alphanumeric kebab/dot-case identifier');
    }

    if (!m.name || typeof m.name !== 'string' || m.name.trim() === '') {
      errors.push('Manifest "name" must be a non-empty string');
    }

    if (!m.version || typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version)) {
      errors.push('Manifest "version" must follow SemVer formatting (e.g. 1.0.0)');
    }

    if (!m.entrypoint || typeof m.entrypoint !== 'string') {
      errors.push('Manifest "entrypoint" must be specified');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
