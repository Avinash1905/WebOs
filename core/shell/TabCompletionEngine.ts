/**
 * @file TabCompletionEngine.ts
 * @description Tab auto-completion engine for shell commands, paths, and variables.
 */

export class TabCompletionEngine {
  public static complete(
    input: string,
    candidates: {
      commands?: string[];
      paths?: string[];
      envVars?: string[];
    }
  ): { prefix: string; matches: string[] } {
    const trimmed = input.trimStart();
    const isVariable = trimmed.startsWith('$');

    if (isVariable) {
      const varPrefix = trimmed.slice(1);
      const matches = (candidates.envVars ?? [])
        .filter(v => v.startsWith(varPrefix))
        .map(v => `$${v}`);
      return { prefix: trimmed, matches };
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length <= 1) {
      // Complete command
      const cmdPrefix = parts[0] ?? '';
      const matches = (candidates.commands ?? []).filter(c => c.startsWith(cmdPrefix));
      return { prefix: cmdPrefix, matches };
    } else {
      // Complete path
      const pathPrefix = parts[parts.length - 1] ?? '';
      const matches = (candidates.paths ?? []).filter(p => p.startsWith(pathPrefix));
      return { prefix: pathPrefix, matches };
    }
  }
}
