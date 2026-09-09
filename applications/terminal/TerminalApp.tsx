import React, { useEffect } from 'react';
import { useTerminalStore } from './store/terminalStore.js';
import { TerminalHeader } from './components/TerminalHeader.js';
import { TerminalOutput } from './components/TerminalOutput.js';
import { TerminalPrompt } from './components/TerminalPrompt.js';
import { TerminalHistorySearch } from './components/TerminalHistorySearch.js';
import './terminal.css';

interface TerminalAppProps {
  windowId?: string;
  appId?: string;
}

export const TerminalApp: React.FC<TerminalAppProps> = () => {
  const {
    tabs,
    activeTabId,
    createNewTab,
    suggestions,
    isHistorySearchOpen,
    isFullscreen,
    preferences,
  } = useTerminalStore();

  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, [tabs, createNewTab]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div
      className={`terminal-app-container ${isFullscreen ? 'fullscreen' : ''}`}
      style={{
        fontSize: `${preferences.fontSize}px`,
        fontFamily: preferences.fontFamily,
      }}
    >
      <TerminalHeader />

      <div className="terminal-body">
        {activeTab && (
          <>
            <TerminalOutput
              lines={activeTab.outputLines}
              autoScroll={preferences.autoScroll}
            />
            <TerminalPrompt
              cwd={activeTab.cwd}
              commandBuffer={activeTab.commandBuffer}
              suggestions={suggestions}
            />
          </>
        )}
      </div>

      {isHistorySearchOpen && <TerminalHistorySearch />}
    </div>
  );
};

export default TerminalApp;
