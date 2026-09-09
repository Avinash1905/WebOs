/**
 * @file ApplicationManifest.ts
 * @description Application manifest validation and helper utilities.
 */

import type { ApplicationManifest } from './types.js';
import { InvalidManifestError } from './ApplicationError.js';

export function validateManifest(manifest: unknown): ApplicationManifest {
  if (!manifest || typeof manifest !== 'object') {
    throw new InvalidManifestError('Manifest must be a non-null object');
  }

  const m = manifest as Partial<ApplicationManifest>;

  if (!m.id || typeof m.id !== 'string' || !m.id.trim()) {
    throw new InvalidManifestError("Manifest must contain a non-empty string 'id'");
  }

  // ID format check (alphanumeric, dots, hyphens, underscores)
  if (!/^[a-zA-Z0-9._-]+$/.test(m.id)) {
    throw new InvalidManifestError(`Manifest ID '${m.id}' contains invalid characters (allowed: a-z, A-Z, 0-9, ., _, -)`);
  }

  if (!m.name || typeof m.name !== 'string' || !m.name.trim()) {
    throw new InvalidManifestError("Manifest must contain a non-empty string 'name'");
  }

  if (!m.version || typeof m.version !== 'string' || !m.version.trim()) {
    throw new InvalidManifestError("Manifest must contain a non-empty string 'version'");
  }

  if (m.permissions !== undefined && !Array.isArray(m.permissions)) {
    throw new InvalidManifestError("'permissions' must be an array of permission strings");
  }

  if (m.fileExtensions !== undefined && !Array.isArray(m.fileExtensions)) {
    throw new InvalidManifestError("'fileExtensions' must be an array of strings");
  }

  return {
    id: m.id.trim(),
    name: m.name.trim(),
    version: m.version.trim(),
    description: m.description,
    icon: m.icon,
    author: m.author,
    main: m.main,
    permissions: m.permissions ? [...m.permissions] : [],
    multiInstance: m.multiInstance ?? false,
    defaultWidth: m.defaultWidth,
    defaultHeight: m.defaultHeight,
    minWidth: m.minWidth,
    minHeight: m.minHeight,
    category: m.category,
    fileExtensions: m.fileExtensions ? [...m.fileExtensions] : [],
    autoStart: m.autoStart ?? false,
    systemApp: m.systemApp ?? false,
    metadata: m.metadata ? { ...m.metadata } : {},
  };
}
