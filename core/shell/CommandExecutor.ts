/**
 * @file CommandExecutor.ts
 * @description Executes parsed shell commands with error catching and telemetry.
 */

import { CommandParser } from './CommandParser.js';
import { CommandResultBuilder } from './CommandResult.js';
import { CommandNotFoundError } from './ShellError.js';
import type { CommandContext, CommandResult, ParsedCommandLine } from './types.js';

export class CommandExecutor {
  public static async execute(
    commandLineOrParsed: string | ParsedCommandLine,
    context: CommandContext
  ): Promise<CommandResult> {
    const startTime = Date.now();
    let parsed: ParsedCommandLine;

    if (typeof commandLineOrParsed === 'string') {
      const expanded = context.env.expandVariables(commandLineOrParsed);
      parsed = CommandParser.parse(expanded);
    } else {
      parsed = commandLineOrParsed;
    }

    if (!parsed.command) {
      return CommandResultBuilder.success('', 0, 0);
    }

    const shell = context.session.getShell();
    const command = shell?.getRegistry().getCommand(parsed.command);

    if (!command) {
      const durationMs = Date.now() - startTime;
      const err = new CommandNotFoundError(parsed.command);

      if (context.eventBus) {
        context.eventBus.emit('COMMAND_FAILED', {
          sessionId: context.session.sessionId,
          command: parsed.command,
          error: err.message,
          exitCode: 127,
        });
      }

      return CommandResultBuilder.error(err.message, 127, '', durationMs);
    }

    if (context.eventBus) {
      context.eventBus.emit('COMMAND_STARTED', {
        sessionId: context.session.sessionId,
        command: parsed.command,
        args: parsed.args,
      });
    }

    try {
      const handlerResult = await command.handler(parsed.args, parsed.flags, context);
      const durationMs = Date.now() - startTime;

      let result: CommandResult;
      if (handlerResult && typeof handlerResult === 'object' && 'success' in handlerResult) {
        result = handlerResult;
      } else if (typeof handlerResult === 'string') {
        result = CommandResultBuilder.success(handlerResult, 0, durationMs);
      } else {
        result = CommandResultBuilder.success('', 0, durationMs);
      }

      if (context.eventBus) {
        if (result.success) {
          context.eventBus.emit('COMMAND_COMPLETED', {
            sessionId: context.session.sessionId,
            command: parsed.command,
            exitCode: result.exitCode,
            durationMs,
          });
        } else {
          context.eventBus.emit('COMMAND_FAILED', {
            sessionId: context.session.sessionId,
            command: parsed.command,
            error: result.error ?? 'Command failed',
            exitCode: result.exitCode,
          });
        }
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      if (context.eventBus) {
        context.eventBus.emit('COMMAND_FAILED', {
          sessionId: context.session.sessionId,
          command: parsed.command,
          error: message,
          exitCode: 1,
        });
      }

      return CommandResultBuilder.error(message, 1, '', durationMs);
    }
  }
}
