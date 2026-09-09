import React, { useState, useEffect, useRef } from 'react';
import { Shell } from '../../core/shell/shell';
import { useAppWindow } from '../../src/contracts/member3Adapters';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2 } from 'lucide-react';
import './terminal.css';

export const TerminalApp: React.FC<{ windowId: string; appId: string }> = ({ windowId, appId }) => {
  const win = useAppWindow(windowId, appId);
  const [shell] = useState(() => new Shell());
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'WebOS 2.0 Terminal Shell [Version 2.0.0]\nType "help" to see available built-in commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrompt(shell.getPrompt());
  }, [shell]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input;
      setInput('');

      if (!cmd.trim()) {
        setHistory((prev) => [...prev, { type: 'input', text: prompt + '' }]);
        return;
      }

      setHistory((prev) => [...prev, { type: 'input', text: prompt + cmd }]);

      if (cmd.trim() === 'clear') {
        setHistory([]);
        return;
      }

      const res = await shell.execute(cmd);
      setPrompt(shell.getPrompt());

      if (res.stdout) {
        setHistory((prev) => [...prev, { type: 'output', text: res.stdout }]);
      }
      if (res.stderr) {
        setHistory((prev) => [...prev, { type: 'error', text: res.stderr }]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = shell.env.historyPrev();
      if (prev !== null) setInput(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = shell.env.historyNext();
      if (next !== null) setInput(next);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete commands or file paths
      const tokens = input.split(' ');
      const lastToken = tokens[tokens.length - 1];
      if (tokens.length === 1 && lastToken) {
        const builtins = ['ls', 'cd', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv', 'ps', 'kill', 'grep', 'touch', 'clear', 'uname', 'whoami', 'date', 'help'];
        const match = builtins.find((b) => b.startsWith(lastToken));
        if (match) setInput(match + ' ');
      }
    }
  };

  return (
    <div className="terminal-app-container" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-toolbar">
        <div className="terminal-title">
          <TerminalIcon size={14} className="terminal-icon" />
          <span>sh — {shell.env.get('USER')}@webos ({win.title})</span>
        </div>
        <button
          className="terminal-tool-btn"
          title="Clear Terminal"
          onClick={(e) => {
            e.stopPropagation();
            setHistory([]);
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="terminal-output-area">
        {history.map((item, idx) => (
          <div key={idx} className={`terminal-line ${item.type}`}>
            <pre>{item.text}</pre>
          </div>
        ))}

        <div className="terminal-input-row">
          <span className="terminal-prompt">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
          />
          <CornerDownLeft size={12} className="terminal-enter-icon" />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
