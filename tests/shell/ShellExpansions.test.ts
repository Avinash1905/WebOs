import { describe, it, expect } from 'vitest';
import {
  PosixLexer,
  AstParser,
  VariableExpander,
  JobController,
  ExtendedBuiltins,
  TabCompletionEngine
} from '../../core/shell/index.js';

describe('Shell Expansions', () => {
  describe('PosixLexer & AstParser', () => {
    it('should tokenize and parse pipelines and redirects', () => {
      const tokens = PosixLexer.tokenize('cat "file name.txt" | grep error > out.log');
      expect(tokens.some(t => t.type === 'PIPE')).toBe(true);
      expect(tokens.some(t => t.type === 'REDIRECT_OUT')).toBe(true);

      const ast = AstParser.parse('cat file.txt | grep error');
      expect(ast.type).toBe('PIPELINE');
    });

    it('should parse logical conditional chains (&&, ||)', () => {
      const ast = AstParser.parse('mkdir test && cd test');
      expect(ast.type).toBe('LOGICAL_OP');
    });
  });

  describe('VariableExpander', () => {
    it('should expand variables and fallback defaults', () => {
      const env = { USER: 'alice', SHELL: '/bin/webos' };
      expect(VariableExpander.expand('Hello $USER', env)).toBe('Hello alice');
      expect(VariableExpander.expand('Home: ${HOME:-/home/default}', env)).toBe('Home: /home/default');
      expect(VariableExpander.expand('Exit: $?', env, 127)).toBe('Exit: 127');
    });
  });

  describe('JobController', () => {
    it('should track background jobs and state transitions', () => {
      const jc = new JobController();
      const job = jc.addJob(501, 'find / -name *.ts');
      expect(job.jobId).toBe(1);
      expect(job.state).toBe('RUNNING');

      jc.updateJobState(1, 'STOPPED');
      expect(jc.getJob(1)?.state).toBe('STOPPED');
      expect(jc.getJobByPid(501)?.jobId).toBe(1);
    });
  });

  describe('ExtendedBuiltins', () => {
    it('should perform grep, wc, head, and tail operations', () => {
      const lines = ['alpha line', 'beta line', 'gamma text', 'error found'];
      const grepRes = ExtendedBuiltins.grep(lines, 'line');
      expect(grepRes).toHaveLength(2);

      const wcRes = ExtendedBuiltins.wc('one two three\nfour five');
      expect(wcRes.lines).toBe(2);
      expect(wcRes.words).toBe(5);

      const headRes = ExtendedBuiltins.head(lines, 2);
      expect(headRes).toEqual(['alpha line', 'beta line']);

      const tailRes = ExtendedBuiltins.tail(lines, 2);
      expect(tailRes).toEqual(['gamma text', 'error found']);
    });
  });

  describe('TabCompletionEngine', () => {
    it('should complete commands, paths, and variables', () => {
      const commands = ['cat', 'cd', 'clear', 'cp'];
      const paths = ['/home/user/Documents', '/home/user/Downloads'];
      const envVars = ['USER', 'HOME', 'PATH'];

      const cmdMatch = TabCompletionEngine.complete('cl', { commands });
      expect(cmdMatch.matches).toEqual(['clear']);

      const pathMatch = TabCompletionEngine.complete('cat /home/user/Doc', { paths });
      expect(pathMatch.matches).toEqual(['/home/user/Documents']);

      const varMatch = TabCompletionEngine.complete('$US', { envVars });
      expect(varMatch.matches).toEqual(['$USER']);
    });
  });
});
