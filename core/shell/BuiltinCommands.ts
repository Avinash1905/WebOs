/**
 * @file BuiltinCommands.ts
 * @description Standard built-in commands for the WebOS Shell.
 */

import { CommandResultBuilder } from './CommandResult.js';
import type { CommandDefinition } from './types.js';

export const BUILTIN_COMMANDS: CommandDefinition[] = [
  // ==========================================
  // 1. File System Commands
  // ==========================================
  {
    name: 'pwd',
    description: 'Print current working directory',
    usage: 'pwd',
    handler: async (_, __, ctx) => ctx.cwd,
  },
  {
    name: 'ls',
    description: 'List directory contents',
    usage: 'ls [-l] [-a] [path]',
    aliases: ['dir'],
    handler: async (args, flags, ctx) => {
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('ls: FileSystem service not available');
      }

      const pathArg = args[0] || ctx.cwd;
      const targetPath = pathArg.startsWith('/')
        ? pathArg
        : ctx.cwd === '/'
        ? `/${pathArg}`
        : `${ctx.cwd}/${pathArg}`;

      const entries = await ctx.fileSystem.listDirectory(
        targetPath,
        {
          includeHidden: Boolean(flags.a || flags.all),
          sortBy: 'name',
          sortOrder: 'asc',
        },
        ctx.securityContext
      );

      if (flags.l || flags.long) {
        const lines = entries.map((e) => {
          const typeChar = e.type === 'directory' ? 'd' : '-';
          const mode = (e.mode ?? (e.type === 'directory' ? 0o755 : 0o644))
            .toString(8)
            .padStart(4, '0');
          const size = (e.size ?? 0).toString().padStart(8, ' ');
          const date = new Date(e.updatedAt ?? e.createdAt)
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ');
          const owner = (e.ownerId ?? 'system').padEnd(10, ' ');
          return `${typeChar}${mode} ${owner} ${size} ${date} ${e.name}`;
        });
        return lines.join('\n');
      }

      return entries.map((e) => e.name).join('  ');
    },
  },
  {
    name: 'cd',
    description: 'Change current working directory',
    usage: 'cd <path>',
    handler: async (args, _, ctx) => {
      const target = args[0] || '~';
      let resolvedPath: string;

      if (target === '~') {
        resolvedPath = ctx.user?.homeDirectory ?? '/';
      } else if (target.startsWith('/')) {
        resolvedPath = target;
      } else {
        resolvedPath = ctx.cwd === '/' ? `/${target}` : `${ctx.cwd}/${target}`;
      }

      const segments: string[] = [];
      for (const part of resolvedPath.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') {
          segments.pop();
        } else {
          segments.push(part);
        }
      }
      const normalized = '/' + segments.join('/');

      if (ctx.fileSystem && normalized !== '/') {
        const stat = await ctx.fileSystem.stat(normalized);
        if (stat.type !== 'directory') {
          return CommandResultBuilder.error(`cd: not a directory: ${target}`);
        }
      }

      ctx.session.setCwd(normalized);
      return '';
    },
  },
  {
    name: 'mkdir',
    description: 'Create directories',
    usage: 'mkdir [-p] <directory...>',
    handler: async (args, flags, ctx) => {
      if (args.length === 0) {
        return CommandResultBuilder.error('mkdir: missing operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('mkdir: FileSystem service not available');
      }

      const recursive = Boolean(flags.p || flags.parents);
      for (const arg of args) {
        const fullPath = arg.startsWith('/')
          ? arg
          : ctx.cwd === '/'
          ? `/${arg}`
          : `${ctx.cwd}/${arg}`;
        await ctx.fileSystem.createDirectory(
          fullPath,
          { recursive },
          ctx.securityContext
        );
      }
      return '';
    },
  },
  {
    name: 'touch',
    description: 'Create empty file or update file timestamp',
    usage: 'touch <file...>',
    handler: async (args, _, ctx) => {
      if (args.length === 0) {
        return CommandResultBuilder.error('touch: missing file operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('touch: FileSystem service not available');
      }

      for (const arg of args) {
        const fullPath = arg.startsWith('/')
          ? arg
          : ctx.cwd === '/'
          ? `/${arg}`
          : `${ctx.cwd}/${arg}`;
        if (await ctx.fileSystem.exists(fullPath)) {
          await ctx.fileSystem.appendFile(fullPath, '', undefined, ctx.securityContext);
        } else {
          await ctx.fileSystem.createFile(
            fullPath,
            { content: '' },
            ctx.securityContext
          );
        }
      }
      return '';
    },
  },
  {
    name: 'cat',
    description: 'Display content of files',
    usage: 'cat <file...>',
    handler: async (args, _, ctx) => {
      if (args.length === 0) {
        return CommandResultBuilder.error('cat: missing file operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('cat: FileSystem service not available');
      }

      const outputs: string[] = [];
      for (const arg of args) {
        const fullPath = arg.startsWith('/')
          ? arg
          : ctx.cwd === '/'
          ? `/${arg}`
          : `${ctx.cwd}/${arg}`;
        const content = await ctx.fileSystem.readFile(
          fullPath,
          { encoding: 'utf-8' },
          ctx.securityContext
        );
        outputs.push(String(content));
      }
      return outputs.join('\n');
    },
  },
  {
    name: 'write',
    description: 'Write content to a file (overwrites existing)',
    usage: 'write <file> <content...>',
    handler: async (args, _, ctx) => {
      if (args.length < 2) {
        return CommandResultBuilder.error('write: usage: write <file> <content...>');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('write: FileSystem service not available');
      }

      const fileArg = args[0]!;
      const content = args.slice(1).join(' ');
      const fullPath = fileArg.startsWith('/')
        ? fileArg
        : ctx.cwd === '/'
        ? `/${fileArg}`
        : `${ctx.cwd}/${fileArg}`;

      await ctx.fileSystem.writeFile(fullPath, content, undefined, ctx.securityContext);
      return '';
    },
  },
  {
    name: 'append',
    description: 'Append content to a file',
    usage: 'append <file> <content...>',
    handler: async (args, _, ctx) => {
      if (args.length < 2) {
        return CommandResultBuilder.error('append: usage: append <file> <content...>');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('append: FileSystem service not available');
      }

      const fileArg = args[0]!;
      const content = args.slice(1).join(' ');
      const fullPath = fileArg.startsWith('/')
        ? fileArg
        : ctx.cwd === '/'
        ? `/${fileArg}`
        : `${ctx.cwd}/${fileArg}`;

      await ctx.fileSystem.appendFile(fullPath, content, undefined, ctx.securityContext);
      return '';
    },
  },
  {
    name: 'cp',
    description: 'Copy files or directories',
    usage: 'cp [-r] <source> <destination>',
    aliases: ['copy'],
    handler: async (args, _, ctx) => {
      if (args.length < 2) {
        return CommandResultBuilder.error('cp: missing source or destination operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('cp: FileSystem service not available');
      }

      const src = args[0]!.startsWith('/')
        ? args[0]!
        : ctx.cwd === '/'
        ? `/${args[0]}`
        : `${ctx.cwd}/${args[0]}`;
      const dst = args[1]!.startsWith('/')
        ? args[1]!
        : ctx.cwd === '/'
        ? `/${args[1]}`
        : `${ctx.cwd}/${args[1]}`;

      await ctx.fileSystem.copy(src, dst, { overwrite: true }, ctx.securityContext);
      return '';
    },
  },
  {
    name: 'mv',
    description: 'Move or rename files and directories',
    usage: 'mv <source> <destination>',
    aliases: ['move', 'rename'],
    handler: async (args, _, ctx) => {
      if (args.length < 2) {
        return CommandResultBuilder.error('mv: missing source or destination operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('mv: FileSystem service not available');
      }

      const src = args[0]!.startsWith('/')
        ? args[0]!
        : ctx.cwd === '/'
        ? `/${args[0]}`
        : `${ctx.cwd}/${args[0]}`;
      const dst = args[1]!.startsWith('/')
        ? args[1]!
        : ctx.cwd === '/'
        ? `/${args[1]}`
        : `${ctx.cwd}/${args[1]}`;

      await ctx.fileSystem.move(src, dst, ctx.securityContext);
      return '';
    },
  },
  {
    name: 'rm',
    description: 'Remove files or directories (moves to trash or deletes permanently)',
    usage: 'rm [-r] [-f] [--permanent] <file...>',
    aliases: ['del', 'remove'],
    handler: async (args, flags, ctx) => {
      if (args.length === 0) {
        return CommandResultBuilder.error('rm: missing operand');
      }
      if (!ctx.fileSystem) {
        return CommandResultBuilder.error('rm: FileSystem service not available');
      }

      const recursive = Boolean(flags.r || flags.R || flags.recursive);
      const permanent = Boolean(flags.permanent || flags.f || flags.force);

      for (const arg of args) {
        const fullPath = arg.startsWith('/')
          ? arg
          : ctx.cwd === '/'
          ? `/${arg}`
          : `${ctx.cwd}/${arg}`;

        if (ctx.trashManager && !permanent) {
          await ctx.trashManager.moveToTrash(fullPath, {
            deletedBy: ctx.securityContext.userId,
          });
        } else {
          await ctx.fileSystem.delete(fullPath, { recursive }, ctx.securityContext);
        }
      }
      return '';
    },
  },

  // ==========================================
  // 2. User & Session Commands
  // ==========================================
  {
    name: 'whoami',
    description: 'Print current logged in username',
    usage: 'whoami',
    handler: async (_, __, ctx) => {
      return ctx.user?.username ?? ctx.securityContext.userId ?? 'anonymous';
    },
  },
  {
    name: 'users',
    description: 'List user accounts',
    usage: 'users',
    handler: async (_, __, ctx) => {
      if (!ctx.userManager) {
        return 'admin\nuser\nguest';
      }
      const list = await ctx.userManager.listUsers();
      return list
        .map((u) => `${u.username.padEnd(12, ' ')} [${u.role.padEnd(6, ' ')}] ${u.homeDirectory}`)
        .join('\n');
    },
  },
  {
    name: 'session',
    description: 'Display current session details',
    usage: 'session',
    handler: async (_, __, ctx) => {
      const lines = [
        `Session ID : ${ctx.session.sessionId}`,
        `User       : ${ctx.user?.username ?? ctx.securityContext.userId ?? 'anonymous'}`,
        `Role       : ${ctx.user?.role ?? ctx.securityContext.role ?? 'USER'}`,
        `Home       : ${ctx.user?.homeDirectory ?? '/'}`,
        `CWD        : ${ctx.cwd}`,
      ];
      return lines.join('\n');
    },
  },

  // ==========================================
  // 3. Process Commands
  // ==========================================
  {
    name: 'ps',
    description: 'List active processes',
    usage: 'ps',
    handler: async (_, __, ctx) => {
      if (!ctx.processManager) {
        return 'PID     NAME            USER       STATE       PRIORITY\n(ProcessManager not attached)';
      }

      const procs = ctx.processManager.listProcesses();
      const header = 'PID     NAME            USER       STATE       PRIORITY';
      const rows = procs.map((p) =>
        `${String(p.pid).padEnd(8, ' ')}${p.name.padEnd(16, ' ')}${p.userId.padEnd(11, ' ')}${p.state.padEnd(12, ' ')}${p.priority}`
      );
      return [header, ...rows].join('\n');
    },
  },
  {
    name: 'kill',
    description: 'Terminate a process by PID',
    usage: 'kill [-9] <pid>',
    handler: async (args, _, ctx) => {
      if (!args[0]) {
        return CommandResultBuilder.error('kill: usage: kill <pid>');
      }
      if (!ctx.processManager) {
        return CommandResultBuilder.error('kill: ProcessManager service not attached');
      }

      const pid = parseInt(args[0], 10);
      if (isNaN(pid)) {
        return CommandResultBuilder.error(`kill: invalid PID '${args[0]}'`);
      }

      await ctx.processManager.terminateProcess(
        pid,
        { reason: 'Killed by shell' },
        ctx.securityContext
      );

      if (ctx.scheduler) {
        ctx.scheduler.stopProcessScheduling(pid);
      }

      return '';
    },
  },

  // ==========================================
  // 4. System Commands
  // ==========================================
  {
    name: 'help',
    description: 'Display help for available commands',
    usage: 'help [command]',
    handler: async (args, _, ctx) => {
      const shell = ctx.session.getShell();
      if (!shell) return 'No shell instance found';

      if (args[0]) {
        const cmd = shell.getRegistry().getCommand(args[0]);
        if (!cmd) {
          return CommandResultBuilder.error(`help: unknown command '${args[0]}'`);
        }
        const aliases = cmd.aliases?.length ? `\nAliases     : ${cmd.aliases.join(', ')}` : '';
        return `Command     : ${cmd.name}\nDescription : ${cmd.description}\nUsage       : ${cmd.usage}${aliases}`;
      }

      const commands = shell.getRegistry().listCommands();
      const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));
      const lines = [
        'WebOS Shell — Available Commands:',
        '================================',
      ];
      for (const cmd of sorted) {
        lines.push(`  ${cmd.name.padEnd(12, ' ')} : ${cmd.description}`);
      }
      lines.push('\nType "help <command>" for detailed command usage.');
      return lines.join('\n');
    },
  },
  {
    name: 'clear',
    description: 'Clear terminal screen',
    usage: 'clear',
    aliases: ['cls'],
    handler: async () => '',
  },
  {
    name: 'echo',
    description: 'Print text or environment variables to standard output',
    usage: 'echo [-n] [text...]',
    handler: async (args, _, ctx) => {
      const text = args.join(' ');
      return ctx.env.expandVariables(text);
    },
  },
  {
    name: 'date',
    description: 'Display current system date and time',
    usage: 'date',
    handler: async () => new Date().toISOString(),
  },
  {
    name: 'uptime',
    description: 'Display WebOS uptime',
    usage: 'uptime',
    handler: async (_, __, ctx) => {
      const scheduler = ctx.scheduler;
      if (scheduler) {
        const metrics = scheduler.getSchedulerMetrics();
        return `WebOS Scheduler Uptime: ${Math.round(metrics.uptimeMs / 1000)}s | Context switches: ${metrics.contextSwitches}`;
      }
      return 'WebOS Uptime: active';
    },
  },
];
