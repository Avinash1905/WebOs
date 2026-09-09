/**
 * @file core/shell/CommandRegistry.ts
 * @description Comprehensive registry of 30+ built-in WebOS shell commands.
 */

import { platform } from '../../src/services/webosPlatform.js';
import { useWindowStore } from '../../src/stores/windowStore.js';
import { appRegistry } from '../../src/contracts/appRegistry.js';
import type { ShellCommandDefinition, ShellExecutionContext, ShellExecutionResult } from './types.js';

export class CommandRegistry {
  private commands: Map<string, ShellCommandDefinition> = new Map();

  constructor() {
    this.registerBuiltins();
  }

  public register(cmd: ShellCommandDefinition): void {
    this.commands.set(cmd.name.toLowerCase(), cmd);
  }

  public get(name: string): ShellCommandDefinition | undefined {
    return this.commands.get(name.toLowerCase());
  }

  public getAll(): ShellCommandDefinition[] {
    return Array.from(this.commands.values());
  }

  private registerBuiltins(): void {
    // 1. help
    this.register({
      name: 'help',
      description: 'Display list of available commands or usage instructions.',
      usage: 'help [command]',
      category: 'utility',
      execute: async (args) => {
        if (args[0]) {
          const target = this.get(args[0]);
          if (!target) return { code: 1, error: `No help entry found for '${args[0]}'.` };
          return {
            code: 0,
            output: `Command: ${target.name}\nDescription: ${target.description}\nUsage: ${target.usage}\nCategory: ${target.category}`,
          };
        }
        const lines = ['WebOS Terminal Shell v2.1.0 - Available Commands:\n'];
        const sorted = this.getAll().sort((a, b) => a.name.localeCompare(b.name));
        sorted.forEach((cmd) => {
          lines.push(`  ${cmd.name.padEnd(12)} - ${cmd.description}`);
        });
        lines.push('\nType "help <command>" for detailed usage parameters.');
        return { code: 0, output: lines.join('\n') };
      },
    });

    // 2. clear
    this.register({
      name: 'clear',
      description: 'Clear the terminal output screen.',
      usage: 'clear',
      category: 'utility',
      execute: async () => ({ code: 0, clearTerminal: true }),
    });

    // 3. pwd
    this.register({
      name: 'pwd',
      description: 'Print current working directory path.',
      usage: 'pwd',
      category: 'filesystem',
      execute: async (_, ctx) => ({ code: 0, output: ctx.cwd }),
    });

    // 4. cd
    this.register({
      name: 'cd',
      description: 'Change working directory.',
      usage: 'cd [path]',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let target = args[0] || '/home/user';
        if (target === '~') target = '/home/user';

        let resolved = target;
        if (!target.startsWith('/')) {
          resolved = `${ctx.cwd === '/' ? '' : ctx.cwd}/${target}`;
        }
        resolved = resolved.replace(/\/+/g, '/');

        const exists = await platform.fileSystem.exists(resolved);
        if (!exists) return { code: 1, error: `cd: no such file or directory: ${target}` };

        const stat = await platform.fileSystem.stat(resolved);
        if (stat.type !== 'directory') return { code: 1, error: `cd: not a directory: ${target}` };

        const success = await ctx.shell.setCwd(resolved);
        if (!success) return { code: 1, error: `cd: failed to change directory to ${resolved}` };
        return { code: 0, newCwd: resolved };
      },
    });

    // 5. ls
    this.register({
      name: 'ls',
      description: 'List directory contents.',
      usage: 'ls [-a] [-l] [path]',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let showHidden = false;
        let longFormat = false;
        let path = ctx.cwd;

        for (const arg of args) {
          if (arg === '-a' || arg === '--all') showHidden = true;
          else if (arg === '-l') longFormat = true;
          else if (arg === '-la' || arg === '-al') {
            showHidden = true;
            longFormat = true;
          } else if (!arg.startsWith('-')) {
            path = arg.startsWith('/') ? arg : `${ctx.cwd === '/' ? '' : ctx.cwd}/${arg}`;
          }
        }

        try {
          const items = await platform.fileSystem.listDirectory(path, { includeHidden: showHidden });
          if (!longFormat) {
            const formatted = items.map((i) => (i.type === 'directory' ? `${i.name}/` : i.name)).join('  ');
            return { code: 0, output: formatted || '(empty directory)' };
          }
          const lines = items.map((i) => {
            const typeChar = i.type === 'directory' ? 'd' : '-';
            const perm = 'rw-r--r--';
            const size = String(i.size || 0).padStart(8);
            const date = new Date(i.updatedAt).toISOString().slice(0, 16).replace('T', ' ');
            const name = i.type === 'directory' ? `${i.name}/` : i.name;
            return `${typeChar}${perm}  user  user  ${size}  ${date}  ${name}`;
          });
          return { code: 0, output: lines.join('\n') || 'total 0' };
        } catch (err: any) {
          return { code: 1, error: err?.message || `ls: cannot access '${path}'` };
        }
      },
    });

    // 6. mkdir
    this.register({
      name: 'mkdir',
      description: 'Create a new directory.',
      usage: 'mkdir <folder_name>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'mkdir: missing operand' };
        const target = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        try {
          await platform.fileSystem.createDirectory(target);
          return { code: 0, output: `Directory created: ${target}` };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'mkdir: failed to create directory' };
        }
      },
    });

    // 7. touch
    this.register({
      name: 'touch',
      description: 'Create a new empty file or update timestamp.',
      usage: 'touch <file_name>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'touch: missing file operand' };
        const target = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        try {
          if (await platform.fileSystem.exists(target)) {
            // Already exists
            return { code: 0 };
          }
          await platform.fileSystem.createFile(target, { content: '' });
          return { code: 0 };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'touch: failed to create file' };
        }
      },
    });

    // 8. cat
    this.register({
      name: 'cat',
      description: 'Concatenate and display file content.',
      usage: 'cat <file_path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'cat: missing file operand' };
        const target = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        try {
          const content = await platform.fileSystem.readFile(target, { encoding: 'utf-8' });
          return { code: 0, output: String(content) };
        } catch (err: any) {
          return { code: 1, error: err?.message || `cat: ${args[0]}: No such file` };
        }
      },
    });

    // 9. head
    this.register({
      name: 'head',
      description: 'Output the first part of files (default 10 lines).',
      usage: 'head [-n lines] <file_path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let count = 10;
        let filePath = '';
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-n' && args[i + 1]) {
            count = parseInt(args[i + 1]!, 10) || 10;
            i++;
          } else if (!args[i]!.startsWith('-')) {
            filePath = args[i]!;
          }
        }
        if (!filePath) return { code: 1, error: 'head: missing file operand' };
        const target = filePath.startsWith('/') ? filePath : `${ctx.cwd === '/' ? '' : ctx.cwd}/${filePath}`;
        try {
          const content = String(await platform.fileSystem.readFile(target, { encoding: 'utf-8' }));
          const lines = content.split('\n').slice(0, count).join('\n');
          return { code: 0, output: lines };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'head: failed to read file' };
        }
      },
    });

    // 10. tail
    this.register({
      name: 'tail',
      description: 'Output the last part of files (default 10 lines).',
      usage: 'tail [-n lines] <file_path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let count = 10;
        let filePath = '';
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-n' && args[i + 1]) {
            count = parseInt(args[i + 1]!, 10) || 10;
            i++;
          } else if (!args[i]!.startsWith('-')) {
            filePath = args[i]!;
          }
        }
        if (!filePath) return { code: 1, error: 'tail: missing file operand' };
        const target = filePath.startsWith('/') ? filePath : `${ctx.cwd === '/' ? '' : ctx.cwd}/${filePath}`;
        try {
          const content = String(await platform.fileSystem.readFile(target, { encoding: 'utf-8' }));
          const allLines = content.split('\n');
          const lines = allLines.slice(Math.max(0, allLines.length - count)).join('\n');
          return { code: 0, output: lines };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'tail: failed to read file' };
        }
      },
    });

    // 11. cp
    this.register({
      name: 'cp',
      description: 'Copy file or directory.',
      usage: 'cp <source> <target>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (args.length < 2) return { code: 1, error: 'cp: missing file operands' };
        const src = args[0]!.startsWith('/') ? args[0]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        const dest = args[1]!.startsWith('/') ? args[1]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[1]}`;
        try {
          await platform.fileSystem.copy(src, dest);
          return { code: 0, output: `Copied ${src} -> ${dest}` };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'cp: copy failed' };
        }
      },
    });

    // 12. mv
    this.register({
      name: 'mv',
      description: 'Move or rename file or directory.',
      usage: 'mv <source> <target>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (args.length < 2) return { code: 1, error: 'mv: missing file operands' };
        const src = args[0]!.startsWith('/') ? args[0]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        const dest = args[1]!.startsWith('/') ? args[1]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[1]}`;
        try {
          await platform.fileSystem.move(src, dest);
          return { code: 0, output: `Moved ${src} -> ${dest}` };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'mv: move failed' };
        }
      },
    });

    // 13. rm
    this.register({
      name: 'rm',
      description: 'Remove file or directory.',
      usage: 'rm [-r] [-f] <target>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let recursive = false;
        let target = '';
        for (const arg of args) {
          if (arg === '-r' || arg === '-rf' || arg === '-fr' || arg === '--recursive') recursive = true;
          else if (!arg.startsWith('-')) target = arg;
        }
        if (!target) return { code: 1, error: 'rm: missing operand' };
        if (target === '/' || target === '/home') return { code: 1, error: 'rm: permission denied to delete root system directory' };

        const fullPath = target.startsWith('/') ? target : `${ctx.cwd === '/' ? '' : ctx.cwd}/${target}`;
        try {
          await platform.fileSystem.delete(fullPath, { recursive });
          return { code: 0 };
        } catch (err: any) {
          return { code: 1, error: err?.message || `rm: cannot remove '${target}'` };
        }
      },
    });

    // 14. rename
    this.register({
      name: 'rename',
      description: 'Rename a file or directory in place.',
      usage: 'rename <old_path> <new_name>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (args.length < 2) return { code: 1, error: 'rename: missing operands' };
        const oldPath = args[0]!.startsWith('/') ? args[0]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        const newName = args[1]!.includes('/') ? args[1]!.split('/').pop() || args[1]! : args[1]!;
        try {
          await platform.fileSystem.rename(oldPath, newName);
          return { code: 0, output: `Renamed '${oldPath}' to '${newName}'` };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'rename failed' };
        }
      },
    });

    // 15. find
    this.register({
      name: 'find',
      description: 'Search for files in directory hierarchy.',
      usage: 'find [path] -name <pattern>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        let pathPrefix = ctx.cwd;
        let query = '';
        for (let i = 0; i < args.length; i++) {
          if ((args[i] === '-name' || args[i] === '--name') && args[i + 1]) {
            query = args[i + 1]!.replace(/[*"]/g, '');
            i++;
          } else if (!args[i]!.startsWith('-')) {
            pathPrefix = args[i]!.startsWith('/') ? args[i]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[i]}`;
          }
        }
        try {
          const results = await platform.fileSystem.search({ query, pathPrefix });
          const matches = results.map((r) => r.path);
          return { code: 0, output: matches.join('\n') || 'No files found matching criteria.' };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'find failed' };
        }
      },
    });

    // 16. grep
    this.register({
      name: 'grep',
      description: 'Search for matching patterns in file contents.',
      usage: 'grep <pattern> <file_path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (args.length < 2) return { code: 1, error: 'grep: missing pattern or file operand' };
        const pattern = args[0]!;
        const filePath = args[1]!.startsWith('/') ? args[1]! : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[1]}`;
        try {
          const content = String(await platform.fileSystem.readFile(filePath, { encoding: 'utf-8' }));
          const lines = content.split('\n');
          const matched = lines.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
          return { code: 0, output: matched.join('\n') || '(no matches)' };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'grep failed' };
        }
      },
    });

    // 17. tree
    this.register({
      name: 'tree',
      description: 'Display directory structure as a visual tree.',
      usage: 'tree [path]',
      category: 'filesystem',
      execute: async (args, ctx) => {
        const rootPath = args[0]
          ? args[0].startsWith('/')
            ? args[0]
            : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`
          : ctx.cwd;
        try {
          const allDescendants = await platform.fileSystem.listDirectory(rootPath, { recursive: true });
          const lines = [rootPath];
          allDescendants.forEach((node) => {
            const rel = node.path.replace(rootPath, '').replace(/^\//, '');
            const depth = rel.split('/').length;
            const indent = '  '.repeat(depth);
            const prefix = node.type === 'directory' ? '📁 ' : '📄 ';
            lines.push(`${indent}${prefix}${node.name}`);
          });
          return { code: 0, output: lines.join('\n') };
        } catch (err: any) {
          return { code: 1, error: err?.message || 'tree failed' };
        }
      },
    });

    // 18. stat
    this.register({
      name: 'stat',
      description: 'Display detailed status & metadata for file or directory.',
      usage: 'stat <path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'stat: missing operand' };
        const path = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        try {
          const s = await platform.fileSystem.stat(path);
          const lines = [
            `File: ${s.name}`,
            `Path: ${s.path}`,
            `Type: ${s.type}`,
            `Size: ${s.size} bytes`,
            `MimeType: ${s.mimeType}`,
            `Created: ${new Date(s.createdAt).toLocaleString()}`,
            `Modified: ${new Date(s.updatedAt).toLocaleString()}`,
          ];
          return { code: 0, output: lines.join('\n') };
        } catch (err: any) {
          return { code: 1, error: err?.message || `stat: cannot stat '${args[0]}'` };
        }
      },
    });

    // 19. file
    this.register({
      name: 'file',
      description: 'Determine file type classification.',
      usage: 'file <path>',
      category: 'filesystem',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'file: missing operand' };
        const path = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        try {
          const s = await platform.fileSystem.stat(path);
          return { code: 0, output: `${s.name}: ${s.type} (${s.mimeType})` };
        } catch (err: any) {
          return { code: 1, error: err?.message || `file: cannot determine '${args[0]}'` };
        }
      },
    });

    // 20. history
    this.register({
      name: 'history',
      description: 'Display or clear command history log.',
      usage: 'history [-c]',
      category: 'utility',
      execute: async (args, ctx) => {
        if (args[0] === '-c' || args[0] === '--clear') {
          ctx.shell.clearHistory();
          return { code: 0, output: 'Command history cleared.' };
        }
        const hist = ctx.shell.getHistory();
        const lines = hist.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`);
        return { code: 0, output: lines.join('\n') || 'History empty.' };
      },
    });

    // 21. whoami
    this.register({
      name: 'whoami',
      description: 'Print effective user name.',
      usage: 'whoami',
      category: 'system',
      execute: async (_, ctx) => ({ code: 0, output: ctx.user }),
    });

    // 22. date
    this.register({
      name: 'date',
      description: 'Display system date and time.',
      usage: 'date',
      category: 'system',
      execute: async () => ({ code: 0, output: new Date().toString() }),
    });

    // 23. time
    this.register({
      name: 'time',
      description: 'Print current Unix timestamp in milliseconds.',
      usage: 'time',
      category: 'system',
      execute: async () => ({ code: 0, output: `Timestamp: ${Date.now()} ms` }),
    });

    // 24. echo
    this.register({
      name: 'echo',
      description: 'Display a line of text.',
      usage: 'echo [text...]',
      category: 'utility',
      execute: async (args) => ({ code: 0, output: args.join(' ') }),
    });

    // 25. env
    this.register({
      name: 'env',
      description: 'List environment variables.',
      usage: 'env',
      category: 'system',
      execute: async (_, ctx) => {
        const lines = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`);
        return { code: 0, output: lines.join('\n') };
      },
    });

    // 26. export
    this.register({
      name: 'export',
      description: 'Set an environment variable.',
      usage: 'export KEY=VALUE',
      category: 'system',
      execute: async (args, ctx) => {
        if (!args[0] || !args[0].includes('=')) return { code: 1, error: 'export: usage: export KEY=VALUE' };
        const [k, v] = args[0].split('=');
        if (k) {
          ctx.shell.setEnv(k, v || '');
          return { code: 0, output: `Exported ${k}=${v || ''}` };
        }
        return { code: 1, error: 'export: invalid variable key' };
      },
    });

    // 27. alias
    this.register({
      name: 'alias',
      description: 'Define or display aliases.',
      usage: 'alias [name=command]',
      category: 'utility',
      execute: async (args, ctx) => {
        if (!args[0]) {
          const aliases = ctx.shell.getAliases();
          const lines = Object.entries(aliases).map(([k, v]) => `alias ${k}='${v}'`);
          return { code: 0, output: lines.join('\n') || 'No aliases defined.' };
        }
        const [name, ...rest] = args[0].split('=');
        if (name && rest.length > 0) {
          const cmd = rest.join('=').replace(/^['"]|['"]$/g, '');
          ctx.shell.setAlias(name, cmd);
          return { code: 0, output: `Alias defined: ${name}='${cmd}'` };
        }
        return { code: 1, error: 'alias: usage: alias name=command' };
      },
    });

    // 28. unalias
    this.register({
      name: 'unalias',
      description: 'Remove command alias.',
      usage: 'unalias <name>',
      category: 'utility',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'unalias: missing alias name' };
        ctx.shell.removeAlias(args[0]);
        return { code: 0, output: `Removed alias '${args[0]}'` };
      },
    });

    // 29. open
    this.register({
      name: 'open',
      description: 'Open a file or directory in the default WebOS application.',
      usage: 'open <path>',
      category: 'developer',
      execute: async (args, ctx) => {
        if (!args[0]) return { code: 1, error: 'open: missing target path' };
        const path = args[0].startsWith('/') ? args[0] : `${ctx.cwd === '/' ? '' : ctx.cwd}/${args[0]}`;
        const exists = await platform.fileSystem.exists(path);
        if (!exists) return { code: 1, error: `open: file or directory not found: '${args[0]}'` };

        const ext = path.split('.').pop()?.toLowerCase() || '';
        const openWin = useWindowStore.getState().openWindow;

        if (['txt', 'js', 'ts', 'json', 'md', 'css', 'html', 'py', 'c', 'cpp'].includes(ext)) {
          openWin({
            id: `code-editor-${Date.now()}`,
            appId: 'code-editor',
            title: `Code Editor - ${path.split('/').pop()}`,
            data: { initialFilePath: path },
          });
        } else if (['wdoc', 'doc', 'docx'].includes(ext)) {
          openWin({
            id: `document-editor-${Date.now()}`,
            appId: 'document-editor',
            title: `Document Editor - ${path.split('/').pop()}`,
            data: { initialFilePath: path },
          });
        } else {
          openWin({
            id: `file-manager-${Date.now()}`,
            appId: 'file-manager',
            title: `File Manager`,
            data: { initialPath: path },
          });
        }
        return { code: 0, output: `Opened '${path}' in application.` };
      },
    });

    // 30. apps
    this.register({
      name: 'apps',
      description: 'List registered WebOS desktop applications.',
      usage: 'apps',
      category: 'system',
      execute: async () => {
        const list = appRegistry.getAllApplications();
        const lines = list.map((a) => `  ${a.id.padEnd(16)} [${a.category.padEnd(12)}] - ${a.name} (v${a.version})`);
        return { code: 0, output: `Registered WebOS Applications:\n${lines.join('\n')}` };
      },
    });

    // 31. ps
    this.register({
      name: 'ps',
      description: 'Report current process status.',
      usage: 'ps',
      category: 'process',
      execute: async () => {
        const windows = useWindowStore.getState().windows;
        const lines = [
          '  PID   TTY      TIME     CMD',
          '    1   tty1     00:00:01 webos_kernel',
          '    2   tty1     00:00:01 member2_shell',
        ];
        windows.forEach((w, idx) => {
          const pid = String(100 + idx + 1).padStart(5);
          lines.push(`${pid}   tty1     00:00:00 ${w.appId} (${w.title})`);
        });
        return { code: 0, output: lines.join('\n') };
      },
    });

    // 32. kill
    this.register({
      name: 'kill',
      description: 'Terminate window or process by PID.',
      usage: 'kill <pid>',
      category: 'process',
      execute: async (args) => {
        if (!args[0]) return { code: 1, error: 'kill: missing PID' };
        const pid = parseInt(args[0], 10);
        if (pid === 1 || pid === 2) return { code: 1, error: 'kill: cannot terminate essential OS kernel process' };
        const windows = useWindowStore.getState().windows;
        const winIdx = pid - 101;
        if (winIdx >= 0 && winIdx < windows.length) {
          const targetWin = windows[winIdx]!;
          useWindowStore.getState().closeWindow(targetWin.id);
          return { code: 0, output: `Terminated process PID ${pid} (${targetWin.appId})` };
        }
        return { code: 1, error: `kill: (${args[0]}) - No such process` };
      },
    });

    // 33. jobs
    this.register({
      name: 'jobs',
      description: 'Display active background jobs.',
      usage: 'jobs',
      category: 'process',
      execute: async () => {
        return { code: 0, output: '[1]+  Running           member2_shell_daemon &' };
      },
    });

    // 34. version
    this.register({
      name: 'version',
      description: 'Display WebOS Kernel & Shell version numbers.',
      usage: 'version',
      category: 'system',
      execute: async () => ({
        code: 0,
        output: 'WebOS Operating System v2.1.0\nKernel Engine: 2.1.0-release\nMember 2 Shell Engine: 2.1.0-stable\nArchitecture: Browser VFS Sandbox x86_64',
      }),
    });

    // 35. about
    this.register({
      name: 'about',
      description: 'Display WebOS overview and system summary.',
      usage: 'about',
      category: 'system',
      execute: async () => ({
        code: 0,
        output: `WebOS 2.0 - Advanced Browser Desktop Environment
Built with React 19, TypeScript, Zustand, and Virtual File System (VFS).
Module 3.2 Developer Tools & Terminal Engine active.
Zero SaaS dependencies. 100% local client execution.`,
      }),
    });
  }
}

export const commandRegistry = new CommandRegistry();
