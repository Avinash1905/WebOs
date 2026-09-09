import { describe, expect, it } from 'vitest';
import {
  ShellScriptInterpreter,
  GlobMatcher,
  AnsiTerminalFormatter,
  JobControlManager,
} from '../../core/shell/index.js';

describe('Shell Deep Subsystems', () => {
  it('ShellScriptInterpreter handles variables, echo, if conditions and command execution', async () => {
    const interpreter = new ShellScriptInterpreter();

    const script = `
# Test script
FOO=bar
echo Hello $FOO
if [ $FOO == bar ]; then
echo Condition passed
fi
`;

    const runner = async (cmd: string, args: string[]) => ({ stdout: `${cmd}:${args.join(',')}`, code: 0 });
    const ctx = await interpreter.executeScript(script, runner);

    expect(ctx.variables.get('FOO')).toBe('bar');
    expect(ctx.output).toContain('Hello bar');
    expect(ctx.output).toContain('Condition passed');
  });

  it('GlobMatcher matches wildcards, nested paths, extensions and filters arrays', () => {
    expect(GlobMatcher.match('*.ts', 'index.ts')).toBe(true);
    expect(GlobMatcher.match('*.ts', 'index.js')).toBe(false);
    expect(GlobMatcher.match('core/**/*.ts', 'core/kernel/index.ts')).toBe(true);
    expect(GlobMatcher.match('core/??.ts', 'core/ab.ts')).toBe(true);
    expect(GlobMatcher.match('core/??.ts', 'core/abc.ts')).toBe(false);

    const paths = ['src/a.ts', 'src/b.js', 'src/sub/c.ts'];
    const tsOnly = GlobMatcher.filter('**/*.ts', paths);
    expect(tsOnly).toEqual(['src/a.ts', 'src/sub/c.ts']);
  });

  it('AnsiTerminalFormatter colorizes, creates RGB styling, and strips ANSI codes', () => {
    const colored = AnsiTerminalFormatter.colorize('Error occurred', AnsiTerminalFormatter.RED);
    expect(colored).toContain('\x1b[31m');
    expect(colored).toContain('\x1b[0m');

    const stripped = AnsiTerminalFormatter.stripAnsi(colored);
    expect(stripped).toBe('Error occurred');

    const rgbText = AnsiTerminalFormatter.rgb('TrueColor', 255, 128, 0);
    expect(rgbText).toContain('\x1b[38;2;255;128;0m');
  });

  it('JobControlManager manages foreground/background jobs and suspension state', () => {
    const jcm = new JobControlManager();

    const j1 = jcm.createJob(501, 'find / -name "*.log"', false);
    expect(j1.jobId).toBe(1);

    const stopped = jcm.stopForegroundJob();
    expect(stopped?.state).toBe('STOPPED');

    // Move to background
    jcm.moveToBackground(j1.jobId);
    expect(jcm.getJob(1)?.state).toBe('RUNNING');

    // Move back to foreground
    jcm.moveToForeground(j1.jobId);
    expect(jcm.getJob(1)?.state).toBe('RUNNING');

    expect(jcm.listJobs().length).toBe(1);
  });
});
