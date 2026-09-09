import React from 'react';
import { Search, X } from 'lucide-react';
import { useTerminalStore } from '../store/terminalStore.js';
import { platform } from '../../../src/services/webosPlatform.js';

export const TerminalHistorySearch: React.FC = () => {
  const {
    historySearchQuery,
    setHistorySearchQuery,
    toggleHistorySearch,
    updateCommandBuffer,
    executeCommandInActiveTab,
  } = useTerminalStore();

  const history = platform.shell.getHistory();
  const filtered = history.filter((cmd) =>
    cmd.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const handleSelectCommand = async (cmd: string, execute = false) => {
    updateCommandBuffer(cmd);
    toggleHistorySearch(false);
    if (execute) {
      await executeCommandInActiveTab(cmd);
    }
  };

  return (
    <div className="terminal-modal-overlay" onClick={() => toggleHistorySearch(false)}>
      <div className="terminal-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terminal-history-modal-header">
          <Search size={16} className="text-accent" />
          <input
            type="text"
            className="terminal-history-search-input"
            placeholder="Reverse-i-search history (Ctrl+R)..."
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-button" onClick={() => toggleHistorySearch(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="terminal-history-list">
          {filtered.length === 0 ? (
            <div className="empty-history">No matching history entries.</div>
          ) : (
            filtered.reverse().map((cmd, idx) => (
              <div
                key={`${cmd}-${idx}`}
                className="terminal-history-item"
                onClick={() => handleSelectCommand(cmd, false)}
                onDoubleClick={() => handleSelectCommand(cmd, true)}
              >
                <span className="history-cmd-text">{cmd}</span>
                <span className="history-hint">Click to insert • Double-click to run</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
