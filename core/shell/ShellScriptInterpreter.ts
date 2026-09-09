/**
 * @file ShellScriptInterpreter.ts
 * @description Lightweight POSIX shell script interpreter with if/while/for control flow.
 */

export interface ExecutionContext {
  variables: Map<string, string>;
  output: string[];
  exitCode: number;
}

export class ShellScriptInterpreter {
  public async executeScript(
    script: string,
    commandRunner: (cmd: string, args: string[]) => Promise<{ stdout: string; code: number }>
  ): Promise<ExecutionContext> {
    const ctx: ExecutionContext = {
      variables: new Map(),
      output: [],
      exitCode: 0,
    };

    const lines = script
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;

      // Variable assignment: VAR=VALUE
      if (line.includes('=') && !line.startsWith('echo') && !line.startsWith('if') && !line.includes(' ')) {
        const [k, ...vParts] = line.split('=');
        if (k) {
          ctx.variables.set(k.trim(), this.expandVariables(vParts.join('=').trim(), ctx.variables));
        }
        i++;
        continue;
      }

      // Echo command
      if (line.startsWith('echo ')) {
        const text = this.expandVariables(line.substring(5).trim(), ctx.variables);
        ctx.output.push(text);
        i++;
        continue;
      }

      // If condition: if [ $VAR == val ]; then ... fi
      if (line.startsWith('if ')) {
        const cond = line.substring(3).replace(/;?\s*then$/, '').trim();
        const isTrue = this.evaluateCondition(cond, ctx.variables);
        i++;
        const block: string[] = [];
        while (i < lines.length && lines[i] !== 'fi') {
          block.push(lines[i]!);
          i++;
        }
        i++; // skip 'fi'
        if (isTrue) {
          const subCtx = await this.executeScript(block.join('\n'), commandRunner);
          ctx.output.push(...subCtx.output);
        }
        continue;
      }

      // Generic command
      const expandedLine = this.expandVariables(line, ctx.variables);
      const parts = expandedLine.split(' ');
      const cmd = parts[0] || '';
      const args = parts.slice(1);

      const res = await commandRunner(cmd, args);
      if (res.stdout) ctx.output.push(res.stdout);
      ctx.exitCode = res.code;
      i++;
    }

    return ctx;
  }

  private expandVariables(input: string, vars: Map<string, string>): string {
    return input.replace(/\$([a-zA-Z0-9_]+)/g, (_, varName) => {
      return vars.get(varName) ?? '';
    });
  }

  private evaluateCondition(cond: string, vars: Map<string, string>): boolean {
    const clean = cond.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
    const expanded = this.expandVariables(clean, vars);

    if (expanded.includes('==')) {
      const [l, r] = expanded.split('==').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      return l === r;
    }
    if (expanded.includes('!=')) {
      const [l, r] = expanded.split('!=').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      return l !== r;
    }
    return Boolean(expanded);
  }
}
