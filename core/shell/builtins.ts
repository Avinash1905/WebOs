/**
 * WebOS Core - Built-in Shell Commands
 * Implements standard POSIX shell commands communicating directly with VFS and Process Manager.
 */

import { VirtualFileSystem } from '../vfs/vfs';
import { ProcessManager } from '../process/processManager';
import { ShellEnvironment } from './environment';
import { Path } from '../vfs/path';

export interface CommandContext {
  args: string[];
  stdin: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  env: ShellEnvironment;
  vfs: VirtualFileSystem;
  processManager: ProcessManager;
}

export type BuiltinCommandFunction = (ctx: CommandContext) => Promise<number>;

export class ShellBuiltins {
  private commands: Map<string, BuiltinCommandFunction> = new Map();

  constructor() {
    this.registerAll();
  }

  public get(name: string): BuiltinCommandFunction | undefined {
    return this.commands.get(name);
  }

  public has(name: string): boolean {
    return this.commands.has(name);
  }

  public listCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  private register(name: string, fn: BuiltinCommandFunction) {
    this.commands.set(name, fn);
  }

  private registerAll() {
    // pwd
    this.register('pwd', async (ctx) => {
      ctx.stdout(ctx.env.pwd + '\n');
      return 0;
    });

    // cd
    this.register('cd', async (ctx) => {
      const target = ctx.args[0] || ctx.env.get('HOME') || '/home/user';
      const resolved = Path.resolve(ctx.env.pwd, target);
      if (!ctx.vfs.exists(resolved)) {
        ctx.stderr(`cd: no such file or directory: ${target}\n`);
        return 1;
      }
      const stat = ctx.vfs.stat(resolved);
      if (!stat.isDirectory()) {
        ctx.stderr(`cd: not a directory: ${target}\n`);
        return 1;
      }
      ctx.env.pwd = resolved;
      return 0;
    });

    // echo
    this.register('echo', async (ctx) => {
      const output = ctx.args.join(' ');
      ctx.stdout(output + '\n');
      return 0;
    });

    // ls
    this.register('ls', async (ctx) => {
      let showAll = false;
      let longFormat = false;
      const targets: string[] = [];

      for (const arg of ctx.args) {
        if (arg.startsWith('-')) {
          if (arg.includes('a')) showAll = true;
          if (arg.includes('l')) longFormat = true;
        } else {
          targets.push(arg);
        }
      }

      const targetDir = targets[0] ? Path.resolve(ctx.env.pwd, targets[0]) : ctx.env.pwd;
      if (!ctx.vfs.exists(targetDir)) {
        ctx.stderr(`ls: cannot access '${targetDir}': No such file or directory\n`);
        return 1;
      }

      const stat = ctx.vfs.stat(targetDir);
      if (!stat.isDirectory()) {
        ctx.stdout(`${Path.basename(targetDir)}\n`);
        return 0;
      }

      const entries = ctx.vfs.readdir(targetDir);
      const filtered = showAll ? entries : entries.filter((e) => !e.name.startsWith('.'));

      if (longFormat) {
        ctx.stdout(`total ${filtered.length}\n`);
        for (const e of filtered) {
          try {
            const s = ctx.vfs.stat(e.path);
            const dateStr = s.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            ctx.stdout(`${s.modeString}  1  ${s.uid}  ${s.gid}  ${s.size.toString().padStart(8, ' ')}  ${dateStr}  ${e.name}\n`);
          } catch {
            ctx.stdout(`-rw-r--r--  1  user  user  0  Jan 1 00:00  ${e.name}\n`);
          }
        }
      } else {
        const names = filtered.map((e) => e.type === 'directory' ? `${e.name}/` : e.name);
        ctx.stdout(names.join('  ') + '\n');
      }
      return 0;
    });

    // cat
    this.register('cat', async (ctx) => {
      if (ctx.args.length === 0) {
        ctx.stdout(ctx.stdin);
        return 0;
      }

      for (const arg of ctx.args) {
        const resolved = Path.resolve(ctx.env.pwd, arg);
        try {
          const content = ctx.vfs.readFile(resolved, 'utf-8') as string;
          ctx.stdout(content);
        } catch (e: any) {
          ctx.stderr(`cat: ${arg}: ${e.message || 'No such file'}\n`);
          return 1;
        }
      }
      return 0;
    });

    // mkdir
    this.register('mkdir', async (ctx) => {
      let makeParents = false;
      const paths: string[] = [];

      for (const arg of ctx.args) {
        if (arg === '-p' || arg === '--parents') {
          makeParents = true;
        } else {
          paths.push(arg);
        }
      }

      if (paths.length === 0) {
        ctx.stderr('mkdir: missing operand\n');
        return 1;
      }

      for (const p of paths) {
        const resolved = Path.resolve(ctx.env.pwd, p);
        try {
          if (makeParents) {
            ctx.vfs.mkdirp(resolved);
          } else {
            ctx.vfs.mkdir(resolved);
          }
        } catch (e: any) {
          ctx.stderr(`mkdir: cannot create directory '${p}': ${e.message}\n`);
          return 1;
        }
      }
      return 0;
    });

    // touch
    this.register('touch', async (ctx) => {
      if (ctx.args.length === 0) {
        ctx.stderr('touch: missing file operand\n');
        return 1;
      }
      for (const file of ctx.args) {
        const resolved = Path.resolve(ctx.env.pwd, file);
        if (!ctx.vfs.exists(resolved)) {
          ctx.vfs.writeFile(resolved, '');
        }
      }
      return 0;
    });

    // rm
    this.register('rm', async (ctx) => {
      let recursive = false;
      const paths: string[] = [];

      for (const arg of ctx.args) {
        if (arg === '-r' || arg === '-rf' || arg === '-R') {
          recursive = true;
        } else if (!arg.startsWith('-')) {
          paths.push(arg);
        }
      }

      for (const p of paths) {
        const resolved = Path.resolve(ctx.env.pwd, p);
        try {
          if (recursive) {
            const stat = ctx.vfs.stat(resolved);
            if (stat.isDirectory()) {
              ctx.vfs.rmdir(resolved);
            } else {
              ctx.vfs.unlink(resolved);
            }
          } else {
            ctx.vfs.unlink(resolved);
          }
        } catch (e: any) {
          ctx.stderr(`rm: cannot remove '${p}': ${e.message}\n`);
          return 1;
        }
      }
      return 0;
    });

    // cp
    this.register('cp', async (ctx) => {
      if (ctx.args.length < 2) {
        ctx.stderr('cp: missing destination file operand\n');
        return 1;
      }
      const src = Path.resolve(ctx.env.pwd, ctx.args[0]);
      const dest = Path.resolve(ctx.env.pwd, ctx.args[1]);
      try {
        ctx.vfs.copyFile(src, dest);
        return 0;
      } catch (e: any) {
        ctx.stderr(`cp: error: ${e.message}\n`);
        return 1;
      }
    });

    // mv
    this.register('mv', async (ctx) => {
      if (ctx.args.length < 2) {
        ctx.stderr('mv: missing destination file operand\n');
        return 1;
      }
      const src = Path.resolve(ctx.env.pwd, ctx.args[0]);
      const dest = Path.resolve(ctx.env.pwd, ctx.args[1]);
      try {
        ctx.vfs.rename(src, dest);
        return 0;
      } catch (e: any) {
        ctx.stderr(`mv: error: ${e.message}\n`);
        return 1;
      }
    });

    // grep
    this.register('grep', async (ctx) => {
      if (ctx.args.length === 0) {
        ctx.stderr('grep: missing pattern\n');
        return 1;
      }
      const pattern = new RegExp(ctx.args[0]);
      let input = ctx.stdin;

      if (ctx.args.length > 1) {
        const filePath = Path.resolve(ctx.env.pwd, ctx.args[1]);
        if (ctx.vfs.exists(filePath)) {
          input = ctx.vfs.readFile(filePath, 'utf-8') as string;
        }
      }

      const lines = input.split('\n');
      const matched = lines.filter((l) => pattern.test(l));
      if (matched.length > 0) {
        ctx.stdout(matched.join('\n') + '\n');
        return 0;
      }
      return 1;
    });

    // ps
    this.register('ps', async (ctx) => {
      const procs = ctx.processManager.listProcesses();
      ctx.stdout('  PID  PPID USER     STAT   TIME COMMAND\n');
      for (const p of procs) {
        const timeSec = Math.floor(p.stats.totalTimeMs / 1000);
        const timeFormatted = `0:${timeSec.toString().padStart(2, '0')}`;
        ctx.stdout(
          `${p.pid.toString().padStart(5, ' ')} ${p.ppid.toString().padStart(5, ' ')} ${p.uid === 0 ? 'root    ' : 'user    '} ${p.state.substring(0, 4).toUpperCase().padEnd(6, ' ')} ${timeFormatted.padStart(6, ' ')} ${p.name}\n`
        );
      }
      return 0;
    });

    // kill
    this.register('kill', async (ctx) => {
      if (ctx.args.length === 0) {
        ctx.stderr('kill: usage: kill <pid>\n');
        return 1;
      }
      const pid = parseInt(ctx.args[0], 10);
      const ok = ctx.processManager.kill(pid);
      if (!ok) {
        ctx.stderr(`kill: (${pid}) - No such process\n`);
        return 1;
      }
      return 0;
    });

    // uname
    this.register('uname', async (ctx) => {
      if (ctx.args.includes('-a')) {
        ctx.stdout('WebOS 2.0.0-generic #1 SMP PREEMPT 2026 x86_64 WebOS GNU/Linux\n');
      } else {
        ctx.stdout('WebOS\n');
      }
      return 0;
    });

    // whoami
    this.register('whoami', async (ctx) => {
      ctx.stdout((ctx.env.get('USER') || 'user') + '\n');
      return 0;
    });

    // date
    this.register('date', async (ctx) => {
      ctx.stdout(new Date().toString() + '\n');
      return 0;
    });

    // clear
    this.register('clear', async (ctx) => {
      ctx.stdout('\x1b[2J\x1b[H');
      return 0;
    });

    // env / export
    this.register('env', async (ctx) => {
      const vars = ctx.env.getAll();
      for (const [k, v] of Object.entries(vars)) {
        ctx.stdout(`${k}=${v}\n`);
      }
      return 0;
    });

    this.register('export', async (ctx) => {
      for (const arg of ctx.args) {
        const [k, v] = arg.split('=');
        if (k && v !== undefined) {
          ctx.env.set(k, v);
        }
      }
      return 0;
    });

    // alias
    this.register('alias', async (ctx) => {
      if (ctx.args.length === 0) {
        const aliases = ctx.env.getAllAliases();
        for (const [k, v] of Object.entries(aliases)) {
          ctx.stdout(`alias ${k}='${v}'\n`);
        }
        return 0;
      }
      for (const arg of ctx.args) {
        const [k, v] = arg.split('=');
        if (k && v) {
          ctx.env.setAlias(k, v.replace(/^['"]|['"]$/g, ''));
        }
      }
      return 0;
    });

    // help
    this.register('help', async (ctx) => {
      ctx.stdout('WebOS Built-in Commands:\n');
      ctx.stdout('  ls, cd, pwd, cat, echo, mkdir, touch, rm, cp, mv, grep\n');
      ctx.stdout('  ps, kill, uname, whoami, date, clear, env, export, alias, help\n');
      return 0;
    });
  }
}

export const shellBuiltins = new ShellBuiltins();
