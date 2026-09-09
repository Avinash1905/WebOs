/**
 * @file VariableExpander.ts
 * @description Parameter and Environment Variable Expansion for WebOS Shell.
 */

export class VariableExpander {
  public static expand(text: string, env: Record<string, string>, lastExitCode = 0): string {
    // 1. Expand $?
    let result = text.replace(/\$\?/g, String(lastExitCode));

    // 2. Expand ${VAR:-default}
    result = result.replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*):-([^}]*)\}/g, (_, varName, defaultVal) => {
      const val = env[varName];
      return val !== undefined && val !== '' ? val : defaultVal;
    });

    // 3. Expand ${VAR}
    result = result.replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, varName) => {
      return env[varName] ?? '';
    });

    // 4. Expand $VAR
    result = result.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, varName) => {
      return env[varName] ?? '';
    });

    return result;
  }
}
