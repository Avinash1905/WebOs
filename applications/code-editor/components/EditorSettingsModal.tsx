import React from 'react';
import { X, Settings } from 'lucide-react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';

export const EditorSettingsModal: React.FC = () => {
  const { isSettingsModalOpen, setSettingsModalOpen, settings, updateSettings } =
    useCodeEditorStore();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={() => setSettingsModalOpen(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div className="title-group">
            <Settings size={18} />
            <span>Code Editor Settings</span>
          </div>
          <button className="icon-btn" onClick={() => setSettingsModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="setting-row">
            <label>Font Size (px)</label>
            <input
              type="number"
              className="setting-input"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value, 10) || 14 })}
            />
          </div>

          <div className="setting-row">
            <label>Font Family</label>
            <input
              type="text"
              className="setting-input"
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            />
          </div>

          <div className="setting-row">
            <label>Tab Size</label>
            <input
              type="number"
              className="setting-input"
              value={settings.tabSize}
              onChange={(e) => updateSettings({ tabSize: parseInt(e.target.value, 10) || 2 })}
            />
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={settings.showMinimap}
                onChange={(e) => updateSettings({ showMinimap: e.target.checked })}
              />
              Show Minimap
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) => updateSettings({ showLineNumbers: e.target.checked })}
              />
              Show Line Numbers
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
              />
              Word Wrapping
            </label>
          </div>

          <div className="setting-row">
            <label>Theme</label>
            <select
              className="setting-select"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
            >
              <option value="vs-dark">VS Dark</option>
              <option value="vs-light">VS Light</option>
              <option value="dracula">Dracula</option>
              <option value="monokai">Monokai</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
