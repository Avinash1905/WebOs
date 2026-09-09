/**
 * @file index.ts
 * @description Barrel export for the WebOS Shell / Terminal Engine.
 */

export * from './Shell.js';
export * from './ShellSession.js';
export * from './CommandRegistry.js';
export * from './CommandParser.js';
export * from './CommandExecutor.js';
export * from './CommandResult.js';
export * from './CommandContext.js';
export * from './BuiltinCommands.js';
export * from './Environment.js';
export * from './ShellHistory.js';
export * from './ShellError.js';
export * from './ShellEvents.js';
export * from './PosixLexer.js';
export * from './AstParser.js';
export * from './VariableExpander.js';
export * from './JobController.js';
export * from './ExtendedBuiltins.js';
export * from './TabCompletionEngine.js';
export * from './types.js';
