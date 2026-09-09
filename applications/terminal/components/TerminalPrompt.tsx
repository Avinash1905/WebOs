import React, { useRef, useEffect } from 'react';
import { useTerminalStore } from '../store/terminalStore.js';
import type { AutocompleteSuggestion } from '../../../core/shell/types.js';

interface TerminalPromptProps {
  cwd: string;
  commandBuffer: string;
  suggestions: AutocompleteSuggestion[];
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  cwd,
  commandBuffer,
  suggestions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    updateCommandBuffer,
    executeCommandInActiveTab,
    navigateHistory,
    triggerAutocomplete,
    selectSuggestion,
    clearActiveTabOutput,
    toggleHistorySearch,
  } = useTerminalStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await executeCommandInActiveTab(commandBuffer);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await triggerAutocomplete();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleHistorySearch(true);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      clearActiveTabOutput();
    }
  };

  return (
    <div className="terminal-prompt-wrapper" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-prompt-row">
        <span className="terminal-prompt-prefix">webos@user:{cwd}$</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-prompt-input"
          value={commandBuffer}
          onChange={(e) => updateCommandBuffer(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
        />
      </div>

      {suggestions.length > 0 && (
        <div className="terminal-autocomplete-popup">
          {suggestions.map((s, idx) => (
            <div
              key={`${s.text}-${idx}`}
              className="terminal-autocomplete-item"
              onClick={() => selectSuggestion(s)}
            >
              <span className={`badge badge-${s.type}`}>{s.type}</span>
              <span className="suggestion-text">{s.text}</span>
              {s.description && <span className="suggestion-desc">{s.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
