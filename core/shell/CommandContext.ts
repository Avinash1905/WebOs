/**
 * @file CommandContext.ts
 * @description Factory for creating command execution contexts.
 */

import type { SecurityContext } from '../permissions/index.js';
import type { Shell } from './Shell.js';
import type { ShellSession } from './ShellSession.js';
import type { CommandContext } from './types.js';

export class CommandContextFactory {
  public static create(
    shell: Shell,
    session: ShellSession,
    stdoutSink?: (msg: string) => void,
    stderrSink?: (msg: string) => void
  ): CommandContext {
    const userManager = shell.getUserManager();
    const user = userManager && session.userId ? userManager.getUserSync(session.userId) : null;

    const securityContext: Partial<SecurityContext> = {
      userId: session.userId ?? 'system',
      role: user?.role ?? (session.userId === 'admin' ? 'ADMIN' : 'USER'),
      isSystem: session.userId === 'system',
    };

    return {
      session,
      fileSystem: shell.getFileSystem(),
      permissionManager: shell.getPermissionManager(),
      userManager,
      processManager: shell.getProcessManager(),
      scheduler: shell.getScheduler(),
      trashManager: shell.getTrashManager(),
      eventBus: shell.getEventBus(),
      cwd: session.getCwd(),
      env: session.getEnv(),
      user,
      securityContext,
      stdout: stdoutSink ?? (() => {}),
      stderr: stderrSink ?? (() => {}),
    };
  }
}
