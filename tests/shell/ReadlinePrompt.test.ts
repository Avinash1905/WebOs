import { describe, expect, it } from 'vitest';
import { ReadlinePromptEngine } from '../../core/shell/index.js';

describe('Readline Prompt Engine', () => {
  it('ReadlinePromptEngine supports character insertion, deletion, and command history', () => {
    const rl = new ReadlinePromptEngine();

    rl.insertChar('l');
    rl.insertChar('s');
    rl.insertChar('x');
    rl.deleteBackward();

    expect(rl.buffer).toBe('ls');
    const line1 = rl.commitLine();
    expect(line1).toBe('ls');

    rl.insertChar('cd /home');
    rl.commitLine();

    // History previous
    expect(rl.historyPrevious()).toBe('cd /home');
    expect(rl.historyPrevious()).toBe('ls');
  });
});
