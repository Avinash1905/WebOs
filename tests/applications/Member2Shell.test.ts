/**
 * @file Member2Shell.test.ts
 * @description Comprehensive unit and integration tests for Member 2 Shell Engine, Parser, and Command Registry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { platform } from '../../src/services/webosPlatform.js';
import { CommandParser } from '../../core/shell/CommandParser.js';
import { member2Shell } from '../../core/shell/Member2Shell.js';
import { commandRegistry } from '../../core/shell/CommandRegistry.js';

describe('Member 2 Shell Engine', () => {
  beforeEach(async () => {
    await platform.initialize();
  });

  describe('Command Parser', () => {
    it('tokenizes raw command lines with quotes and spaces', () => {
      const line = 'echo "hello world" \'second arg\' test\\ string';
      const tokens = CommandParser.tokenize(line);
      expect(tokens).toEqual(['echo', 'hello world', 'second arg', 'test string']);
    });

    it('parses flags, arguments, and env vars', () => {
      const line = 'ls -l -a --sort=name /home/user';
      const parsed = CommandParser.parse(line, { USER: 'user' });
      expect(parsed).not.toBeNull();
      expect(parsed!.command).toBe('ls');
      expect(parsed!.args).toContain('/home/user');
      expect(parsed!.flags).toHaveProperty('l', true);
      expect(parsed!.flags).toHaveProperty('a', true);
      expect(parsed!.flags).toHaveProperty('sort', 'name');
    });

    it('parses pipes and redirection targets', () => {
      const line = 'cat /home/user/notes.txt | grep urgent > /home/user/filtered.txt';
      const parsed = CommandParser.parse(line);
      expect(parsed).not.toBeNull();
      expect(parsed!.command).toBe('cat');
      expect(parsed!.pipeTo).toBeDefined();
      expect(parsed!.pipeTo!.command).toBe('grep');
      expect(parsed!.pipeTo!.redirectTo).toEqual({ file: '/home/user/filtered.txt', append: false });
    });
  });

  describe('Built-in Shell Commands', () => {
    it('executes pwd and cd navigation', async () => {
      await member2Shell.setCwd('/home/user');
      expect(member2Shell.getCwd()).toBe('/home/user');

      let res = await member2Shell.executeCommand('pwd');
      expect(res.code).toBe(0);
      expect(res.output).toBe('/home/user');

      res = await member2Shell.executeCommand('cd Documents');
      expect(res.code).toBe(0);
      expect(member2Shell.getCwd()).toBe('/home/user/Documents');
    });

    it('creates files and directories via mkdir, touch, cat, echo', async () => {
      await member2Shell.setCwd('/home/user');

      await member2Shell.executeCommand('mkdir TestDir');
      expect(await platform.fileSystem.exists('/home/user/TestDir')).toBe(true);

      await member2Shell.executeCommand('touch /home/user/TestDir/sample.txt');
      expect(await platform.fileSystem.exists('/home/user/TestDir/sample.txt')).toBe(true);

      await member2Shell.executeCommand('echo "Line 1" > /home/user/TestDir/sample.txt');
      let catRes = await member2Shell.executeCommand('cat /home/user/TestDir/sample.txt');
      expect(catRes.output).toBe('Line 1');

      await member2Shell.executeCommand('echo "Line 2" >> /home/user/TestDir/sample.txt');
      catRes = await member2Shell.executeCommand('cat /home/user/TestDir/sample.txt');
      expect(catRes.output).toContain('Line 1');
      expect(catRes.output).toContain('Line 2');
    });

    it('performs file manipulations with cp, mv, rename, rm', async () => {
      await member2Shell.setCwd('/home/user');
      await member2Shell.executeCommand('echo "Data" > /home/user/source.txt');

      await member2Shell.executeCommand('cp /home/user/source.txt /home/user/copy.txt');
      expect(await platform.fileSystem.exists('/home/user/copy.txt')).toBe(true);

      await member2Shell.executeCommand('mv /home/user/copy.txt /home/user/moved.txt');
      expect(await platform.fileSystem.exists('/home/user/copy.txt')).toBe(false);
      expect(await platform.fileSystem.exists('/home/user/moved.txt')).toBe(true);

      await member2Shell.executeCommand('rename /home/user/moved.txt renamed.txt');
      expect(await platform.fileSystem.exists('/home/user/renamed.txt')).toBe(true);

      await member2Shell.executeCommand('rm /home/user/renamed.txt');
      expect(await platform.fileSystem.exists('/home/user/renamed.txt')).toBe(false);
    });

    it('executes system, process, and utility commands', async () => {
      let res = await member2Shell.executeCommand('whoami');
      expect(res.output).toBe('user');

      res = await member2Shell.executeCommand('version');
      expect(res.output).toContain('WebOS Operating System');

      res = await member2Shell.executeCommand('apps');
      expect(res.output).toContain('terminal');

      res = await member2Shell.executeCommand('ps');
      expect(res.output).toContain('webos_kernel');

      res = await member2Shell.executeCommand('history');
      expect(res.output).toContain('whoami');
    });
  });

  describe('Autocomplete Engine', () => {
    it('suggests matching commands', async () => {
      const suggestions = await member2Shell.autocomplete('cl');
      const names = suggestions.map((s) => s.text);
      expect(names).toContain('clear');
    });

    it('suggests VFS files and directories', async () => {
      await member2Shell.setCwd('/home/user');
      const suggestions = await member2Shell.autocomplete('cd Doc');
      expect(suggestions.some((s) => s.text.includes('Documents'))).toBe(true);
    });
  });
});
