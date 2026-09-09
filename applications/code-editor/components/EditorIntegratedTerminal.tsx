import React, { useState } from 'react';
import { X, Minus, Terminal as TerminalIcon } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';
import { platform } from '../../../src/services/webosPlatform.js';

export const EditorIntegratedTerminal: React.FC = () => {
  const {
    isIntegratedTerminalOpen,
    toggleIntegratedTerminal,
    integratedTerminalHeight,
  } = useCodeEditorStore();

  const [inputVal, setInputVal] = useState('');
  const [outputLines, setOutputLines] = useState<string[]>([
    'WebOS Integrated Terminal Shell v2.1.0\nType "help" to view commands.\n',
  ]);

  if (!isIntegratedTerminalOpen) return null;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const line = inputVal.trim();
      if (!line) return;

      const cwd = platform.shell.getCwd();
      const promptLine = `webos@user:${cwd}$ ${line}`;

      const res = await platform.shell.executeCommand(line);
      let newLines = [...outputLines, promptLine];

      if (res.clearTerminal) {
        newLines = [];
      } else {
        if (res.error) newLines.push(`[error] ${res.error}`);
        if (res.output) newLines.push(res.output);
      }

      setOutputLines(newLines);
      setInputVal('');
    }
  };

  return (
    <div className="integrated-terminal-panel" style={{ height: `${integratedTerminalHeight}px` }}>
      <div className="terminal-pane-header">
        <div className="pane-title">
          <TerminalIcon size={14} />
          <span>INTEGRATED TERMINAL (Member 2 Shell)</span>
        </div>
        <div className="pane-actions">
          <button className="icon-btn" onClick={() => toggleIntegratedTerminal(false)}>
            <Minus size={14} />
          </button>
          <button className="icon-btn" onClick={() => toggleIntegratedTerminal(false)}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="terminal-pane-body">
        {outputLines.map((line, idx) => (
          <pre key={idx} className="terminal-line">{line}</pre>
        ))}

        <div className="terminal-prompt-line">
          <span className="prompt-prefix">webos@user:{platform.shell.getCwd()}$</span>
          <input
            type="text"
            className="prompt-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
