import { describe, expect, it } from 'vitest';
import { CommandParser, InvalidCommandSyntaxError } from '../../core/shell/index.js';

describe('Shell Command Parser', () => {
  it('parses simple commands and positional arguments', () => {
    const parsed = CommandParser.parse('echo hello world');
    expect(parsed.command).toBe('echo');
    expect(parsed.args).toEqual(['hello', 'world']);
    expect(parsed.flags).toEqual({});
  });

  it('parses short and long flags', () => {
    const parsed = CommandParser.parse('ls -l -a --recursive /home/user');
    expect(parsed.command).toBe('ls');
    expect(parsed.args).toEqual(['/home/user']);
    expect(parsed.flags.l).toBe(true);
    expect(parsed.flags.a).toBe(true);
    expect(parsed.flags.recursive).toBe(true);
  });

  it('parses combined short flags', () => {
    const parsed = CommandParser.parse('ls -la /tmp');
    expect(parsed.command).toBe('ls');
    expect(parsed.flags.l).toBe(true);
    expect(parsed.flags.a).toBe(true);
    expect(parsed.args).toEqual(['/tmp']);
  });

  it('parses key-value flags with equals sign', () => {
    const parsed = CommandParser.parse('gcc --output=build/app.bin main.c');
    expect(parsed.command).toBe('gcc');
    expect(parsed.flags.output).toBe('build/app.bin');
    expect(parsed.args).toEqual(['main.c']);
  });

  it('handles single and double quoted arguments with spaces', () => {
    const parsed = CommandParser.parse('mkdir "My Documents" \'Project Alpha\'');
    expect(parsed.command).toBe('mkdir');
    expect(parsed.args).toEqual(['My Documents', 'Project Alpha']);
  });

  it('handles escaped quotes and characters', () => {
    const parsed = CommandParser.parse(String.raw`echo \"hello\ world\"`);
    expect(parsed.command).toBe('echo');
    expect(parsed.args).toEqual(['"hello world"']);
  });

  it('throws InvalidCommandSyntaxError on unterminated quotes', () => {
    expect(() => CommandParser.parse('cat "unfinished string')).toThrow(
      InvalidCommandSyntaxError
    );
  });

  it('handles empty input gracefully', () => {
    const parsed = CommandParser.parse('   ');
    expect(parsed.command).toBe('');
    expect(parsed.args).toEqual([]);
    expect(parsed.flags).toEqual({});
  });
});
