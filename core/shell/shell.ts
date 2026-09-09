/**
 * WebOS Core - Interactive Shell Interpreter Engine
 * Parses, evaluates, and executes command pipelines with variable expansion and standard streams.
 */

import { ShellParser, CommandAST } from './parser';
import { ShellEnvironment } from './environment';
import { shellBuiltins } from './builtins';
import { vfs, VirtualFileSystem } from '../vfs/vfs';
import { processManager, ProcessManager } from '../process/processManager';
import { Path } from '../vfs/path';

export interface ShellExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class Shell {
  public env: ShellEnvironment;
  public vfs: VirtualFileSystem;
  public processManager: ProcessManager;

  constructor(
    env?: ShellEnvironment,
    vfsInstance?: VirtualFileSystem,
    pmInstance?: ProcessManager
  ) {
    this.env = env || new ShellEnvironment();
    this.vfs = vfsInstance || vfs;
    this.processManager = pmInstance || processManager;
  }

  /**
   * Executes a command string and returns its exit code and buffered output.
   */
  public async execute(commandLine: string): Promise<ShellExecutionResult> {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { exitCode: 0, stdout: '', stderr: '' };
    }

    this.env.addHistory(trimmed);

    // Variable expansion
    const expanded = this.env.expandVariables(trimmed);

    try {
      const statements = ShellParser.parse(expanded);
      let lastExitCode = 0;
      let fullStdout = '';
      let fullStderr = '';

      for (const stmt of statements) {
        const pipeResult = await this.executePipeline(stmt.pipeline);
        fullStdout += pipeResult.stdout;
        fullStderr += pipeResult.stderr;
        lastExitCode = pipeResult.exitCode;

        if (stmt.connector === 'AND' && lastExitCode !== 0) {
          break;
        }
        if (stmt.connector === 'OR' && lastExitCode === 0) {
          break;
        }
      }

      return {
        exitCode: lastExitCode,
        stdout: fullStdout,
        stderr: fullStderr,
      };
    } catch (err: any) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: `sh: syntax error: ${err.message || err}\n`,
      };
    }
  }

  private async executePipeline(pipeline: { commands: CommandAST[]; isBackground: boolean }): Promise<ShellExecutionResult> {
    let currentInput = '';
    let lastExit = 0;
    let combinedStderr = '';

    for (let i = 0; i < pipeline.commands.length; i++) {
      const cmd = pipeline.commands[i];
      let cmdStdout = '';
      let cmdStderr = '';

      // Check Alias
      const alias = this.env.getAlias(cmd.name);
      if (alias) {
        const aliasTokens = alias.split(' ');
        cmd.name = aliasTokens[0];
        cmd.args = [...aliasTokens.slice(1), ...cmd.args];
      }

      const builtin = shellBuiltins.get(cmd.name);

      if (builtin) {
        lastExit = await builtin({
          args: cmd.args,
          stdin: currentInput,
          stdout: (text) => {
            cmdStdout += text;
          },
          stderr: (text) => {
            cmdStderr += text;
          },
          env: this.env,
          vfs: this.vfs,
          processManager: this.processManager,
        });
      } else {
        cmdStderr = `sh: command not found: ${cmd.name}\n`;
        lastExit = 127;
      }

      // Handle Redirections
      for (const redir of cmd.redirects) {
        const targetPath = Path.resolve(this.env.pwd, redir.target);
        if (redir.type === 'out') {
          this.vfs.writeFile(targetPath, cmdStdout);
          cmdStdout = ''; // redirected
        } else if (redir.type === 'append') {
          this.vfs.appendFile(targetPath, cmdStdout);
          cmdStdout = '';
        }
      }

      combinedStderr += cmdStderr;
      currentInput = cmdStdout;
    }

    return {
      exitCode: lastExit,
      stdout: currentInput,
      stderr: combinedStderr,
    };
  }

  public getPrompt(): string {
    const user = this.env.get('USER') || 'user';
    const cwd = this.env.pwd;
    const home = this.env.get('HOME') || '/home/user';
    const displayPath = cwd.startsWith(home) ? '~' + cwd.substring(home.length) : cwd;
    return `${user}@webos:${displayPath}$ `;
  }
}
