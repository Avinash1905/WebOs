import React from 'react';
import { Search, X } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';
import type { CodeEditorCommand } from '../types.js';

export const EditorCommandPalette: React.FC = () => {
  const {
    commandPaletteQuery,
    setCommandPaletteQuery,
    toggleCommandPalette,
    createNewFile,
    saveActiveFile,
    closeTab,
    closeAllTabs,
    activeTabId,
    setSidebarTab,
    toggleIntegratedTerminal,
    updateSettings,
    settings,
    setSettingsModalOpen,
  } = useCodeEditorStore();

  const commands: CodeEditorCommand[] = [
    {
      id: 'new-file',
      title: 'File: New File',
      category: 'File',
      shortcut: 'Ctrl+N',
      action: () => createNewFile(),
    },
    {
      id: 'save-file',
      title: 'File: Save',
      category: 'File',
      shortcut: 'Ctrl+S',
      action: () => saveActiveFile(),
    },
    {
      id: 'close-tab',
      title: 'File: Close Active Tab',
      category: 'File',
      shortcut: 'Ctrl+W',
      action: () => activeTabId && closeTab(activeTabId),
    },
    {
      id: 'close-all',
      title: 'File: Close All Tabs',
      category: 'File',
      action: () => closeAllTabs(),
    },
    {
      id: 'toggle-explorer',
      title: 'View: Toggle File Explorer',
      category: 'View',
      shortcut: 'Ctrl+Shift+E',
      action: () => setSidebarTab('explorer'),
    },
    {
      id: 'toggle-terminal',
      title: 'View: Toggle Integrated Terminal',
      category: 'View',
      shortcut: 'Ctrl+`',
      action: () => toggleIntegratedTerminal(),
    },
    {
      id: 'increase-font',
      title: 'Preferences: Increase Font Size',
      category: 'Preferences',
      action: () => updateSettings({ fontSize: settings.fontSize + 1 }),
    },
    {
      id: 'decrease-font',
      title: 'Preferences: Decrease Font Size',
      category: 'Preferences',
      action: () => updateSettings({ fontSize: Math.max(10, settings.fontSize - 1) }),
    },
    {
      id: 'toggle-minimap',
      title: 'View: Toggle Minimap',
      category: 'View',
      action: () => updateSettings({ showMinimap: !settings.showMinimap }),
    },
    {
      id: 'toggle-wordwrap',
      title: 'View: Toggle Word Wrapping',
      category: 'View',
      action: () => updateSettings({ wordWrap: !settings.wordWrap }),
    },
    {
      id: 'open-settings',
      title: 'Preferences: Open Editor Settings',
      category: 'Preferences',
      action: () => setSettingsModalOpen(true),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(commandPaletteQuery.toLowerCase())
  );

  const handleRunCommand = (cmd: CodeEditorCommand) => {
    toggleCommandPalette(false);
    cmd.action();
  };

  return (
    <div className="palette-modal-overlay" onClick={() => toggleCommandPalette(false)}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-header">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="palette-input"
            placeholder="Type a command or search actions..."
            value={commandPaletteQuery}
            onChange={(e) => setCommandPaletteQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-btn" onClick={() => toggleCommandPalette(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="empty-palette">No matching editor commands.</div>
          ) : (
            filtered.map((cmd) => (
              <div
                key={cmd.id}
                className="palette-item"
                onClick={() => handleRunCommand(cmd)}
              >
                <div className="item-title-group">
                  {cmd.category && <span className="category-tag">{cmd.category}</span>}
                  <span className="item-title">{cmd.title}</span>
                </div>
                {cmd.shortcut && <span className="item-shortcut">{cmd.shortcut}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
