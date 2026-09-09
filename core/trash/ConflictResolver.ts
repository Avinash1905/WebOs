/**
 * @file ConflictResolver.ts
 * @description Restore path conflict detection and resolution strategies for trashed items.
 */

export type ConflictResolutionMode = 'OVERWRITE' | 'RENAME_AUTO_INCREMENT' | 'RENAME_TIMESTAMP' | 'SKIP';

export class ConflictResolver {
  public static resolveDestination(
    originalPath: string,
    existingPaths: Set<string>,
    mode: ConflictResolutionMode
  ): { targetPath: string; action: 'RESTORE' | 'SKIP' } {
    if (!existingPaths.has(originalPath)) {
      return { targetPath: originalPath, action: 'RESTORE' };
    }

    switch (mode) {
      case 'OVERWRITE':
        return { targetPath: originalPath, action: 'RESTORE' };
      case 'SKIP':
        return { targetPath: originalPath, action: 'SKIP' };
      case 'RENAME_TIMESTAMP': {
        const timestamp = Date.now();
        const extIdx = originalPath.lastIndexOf('.');
        const slashIdx = originalPath.lastIndexOf('/');
        if (extIdx > slashIdx && extIdx !== -1) {
          const base = originalPath.slice(0, extIdx);
          const ext = originalPath.slice(extIdx);
          return { targetPath: `${base}_${timestamp}${ext}`, action: 'RESTORE' };
        }
        return { targetPath: `${originalPath}_${timestamp}`, action: 'RESTORE' };
      }
      case 'RENAME_AUTO_INCREMENT': {
        const extIdx = originalPath.lastIndexOf('.');
        const slashIdx = originalPath.lastIndexOf('/');
        let counter = 1;
        let candidate = '';

        while (true) {
          if (extIdx > slashIdx && extIdx !== -1) {
            const base = originalPath.slice(0, extIdx);
            const ext = originalPath.slice(extIdx);
            candidate = `${base} (${counter})${ext}`;
          } else {
            candidate = `${originalPath} (${counter})`;
          }

          if (!existingPaths.has(candidate)) {
            return { targetPath: candidate, action: 'RESTORE' };
          }
          counter++;
        }
      }
    }
  }
}
