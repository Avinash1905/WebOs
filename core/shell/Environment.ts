/**
 * @file Environment.ts
 * @description Manages session environment variables with string expansion.
 */

export class Environment {
  private readonly _variables = new Map<string, string>();

  constructor(initialVars?: Record<string, string>) {
    if (initialVars) {
      for (const [k, v] of Object.entries(initialVars)) {
        this._variables.set(k, v);
      }
    }
  }

  public getVariable(key: string): string | undefined {
    return this._variables.get(key);
  }

  public setVariable(key: string, value: string): void {
    this._variables.set(key, value);
  }

  public deleteVariable(key: string): boolean {
    return this._variables.delete(key);
  }

  public hasVariable(key: string): boolean {
    return this._variables.has(key);
  }

  public getVariables(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this._variables.entries()) {
      result[k] = v;
    }
    return result;
  }

  /**
   * Expands variable references ($VAR or ${VAR}) in a string.
   */
  public expandVariables(input: string): string {
    return input.replace(/\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g, (_, __, braced, simple) => {
      const varName = braced || simple;
      return this._variables.get(varName) ?? '';
    });
  }
}
