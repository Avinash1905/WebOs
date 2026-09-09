/**
 * @file AppPermission.ts
 * @description Permission check utilities for Applications.
 */

import type { ApplicationManifest, AppPermission } from './types.js';
import { AppPermissionError } from './ApplicationError.js';

export const ALL_APP_PERMISSIONS: readonly AppPermission[] = [
  'storage:read',
  'storage:write',
  'clipboard:read',
  'clipboard:write',
  'filesystem:read',
  'filesystem:write',
  'network',
  'notifications',
  'process:manage',
  'system:admin',
] as const;

export function hasAppPermission(
  manifest: ApplicationManifest,
  permission: AppPermission
): boolean {
  if (manifest.systemApp) {
    return true; // System apps have full permissions
  }
  return !!manifest.permissions && manifest.permissions.includes(permission);
}

export function assertAppPermission(
  manifest: ApplicationManifest,
  permission: AppPermission
): void {
  if (!hasAppPermission(manifest, permission)) {
    throw new AppPermissionError(manifest.id, permission);
  }
}
