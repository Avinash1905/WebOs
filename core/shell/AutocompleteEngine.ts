/**
 * @file core/shell/AutocompleteEngine.ts
 * @description Context-aware autocomplete engine for commands, VFS paths, flags, and history.
 */

import { platform } from '../../src/services/webosPlatform.js';
import { commandRegistry } from './CommandRegistry.js';
import type { AutocompleteSuggestion, IMember2Shell } from './types.js';

export class AutocompleteEngine {
  public static async getSuggestions(
    input: string,
    shell: IMember2Shell
  ): Promise<AutocompleteSuggestion[]> {
    const trimmed = input.trimStart();
    if (!trimmed) return [];

    const parts = trimmed.split(/\s+/);

    // Single token: match commands
    if (parts.length === 1) {
      const token = parts[0]!.toLowerCase();
      const allCmds = commandRegistry.getAll();
      const cmdMatches = allCmds
        .filter((c) => c.name.toLowerCase().startsWith(token))
        .map((c) => ({
          text: c.name,
          type: 'command' as const,
          description: c.description,
        }));

      return cmdMatches;
    }

    // Multiple tokens: match flags or VFS paths
    const lastToken = parts[parts.length - 1]!;
    const cmdName = parts[0]!.toLowerCase();
    const cmdDef = commandRegistry.get(cmdName);

    const suggestions: AutocompleteSuggestion[] = [];

    // 1. Flag suggestions if starts with -
    if (lastToken.startsWith('-') && cmdDef?.options) {
      cmdDef.options.forEach((opt) => {
        if (opt.name.startsWith(lastToken)) {
          suggestions.push({ text: opt.name, type: 'flag', description: opt.description });
        }
        if (opt.shortFlag && opt.shortFlag.startsWith(lastToken)) {
          suggestions.push({ text: opt.shortFlag, type: 'flag', description: opt.description });
        }
      });
      if (suggestions.length > 0) return suggestions;
    }

    // 2. VFS Path suggestions
    try {
      const cwd = shell.getCwd();
      let searchDir = cwd;
      let filePrefix = lastToken;

      if (lastToken.includes('/')) {
        const lastSlashIndex = lastToken.lastIndexOf('/');
        const dirPart = lastToken.substring(0, lastSlashIndex);
        filePrefix = lastToken.substring(lastSlashIndex + 1);

        if (dirPart.startsWith('/')) {
          searchDir = dirPart || '/';
        } else {
          searchDir = `${cwd === '/' ? '' : cwd}/${dirPart}`;
        }
      }

      searchDir = searchDir.replace(/\/+/g, '/') || '/';

      if (await platform.fileSystem.exists(searchDir)) {
        const items = await platform.fileSystem.listDirectory(searchDir, { includeHidden: true });
        const pathMatches = items
          .filter((item) => item.name.toLowerCase().startsWith(filePrefix.toLowerCase()))
          .map((item) => {
            const isDir = item.type === 'directory';
            let completedText = item.name;
            if (lastToken.includes('/')) {
              const lastSlashIndex = lastToken.lastIndexOf('/');
              completedText = `${lastToken.substring(0, lastSlashIndex + 1)}${item.name}`;
            }
            if (isDir && !completedText.endsWith('/')) {
              completedText += '/';
            }
            return {
              text: completedText,
              type: (isDir ? 'directory' : 'file') as 'directory' | 'file',
              description: isDir ? 'Directory' : `File (${item.size} bytes)`,
            };
          });

        suggestions.push(...pathMatches);
      }
    } catch {
      // ignore VFS query errors during typing
    }

    return suggestions;
  }
}
