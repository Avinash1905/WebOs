/**
 * @file TextEditorPreferencesModal.tsx
 * @description Preferences dialog for configuring font size, line wrap, tab size, and autosave.
 */

import React from 'react';
import { X, Settings } from 'lucide-react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorPreferencesModal: React.FC = () => {
  const { isPreferencesOpen, preferences, setPreferencesOpen, updatePreferences } = useTextEditorStore();

  if (!isPreferencesOpen) return null;

  return (
    <div className="te-modal-overlay" onClick={() => setPreferencesOpen(false)}>
      <div className="te-modal" onClick={(e) => e.stopPropagation()}>
        <div className="te-modal-header">
          <div className="te-modal-title">
            <Settings size={18} />
            <span>Editor Preferences</span>
          </div>
          <button className="te-modal-close" onClick={() => setPreferencesOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="te-modal-body">
          <div className="te-pref-group">
            <label className="te-pref-label">Font Family:</label>
            <select
              className="te-select"
              value={preferences.fontFamily}
              onChange={(e) => updatePreferences({ fontFamily: e.target.value as any })}
            >
              <option value="Monospace">Monospace</option>
              <option value="Sans-Serif">Sans-Serif</option>
              <option value="Serif">Serif</option>
            </select>
          </div>

          <div className="te-pref-group">
            <label className="te-pref-label">Font Size ({preferences.fontSize}px):</label>
            <input
              type="range"
              min="10"
              max="28"
              value={preferences.fontSize}
              onChange={(e) => updatePreferences({ fontSize: Number(e.target.value) })}
            />
          </div>

          <div className="te-pref-group">
            <label className="te-pref-label">Tab Size:</label>
            <select
              className="te-select"
              value={preferences.tabSize}
              onChange={(e) => updatePreferences({ tabSize: Number(e.target.value) })}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="8">8 Spaces</option>
            </select>
          </div>

          <div className="te-pref-group">
            <label className="te-pref-label">Autosave Interval:</label>
            <select
              className="te-select"
              value={preferences.autosaveIntervalMs}
              onChange={(e) => updatePreferences({ autosaveIntervalMs: Number(e.target.value) })}
            >
              <option value="0">Disabled</option>
              <option value="3000">3 Seconds</option>
              <option value="5000">5 Seconds</option>
              <option value="10000">10 Seconds</option>
            </select>
          </div>

          <div className="te-pref-checkbox-group">
            <label className="te-checkbox-label">
              <input
                type="checkbox"
                checked={preferences.lineWrapping}
                onChange={(e) => updatePreferences({ lineWrapping: e.target.checked })}
              />
              Enable Word Wrapping
            </label>
            <label className="te-checkbox-label">
              <input
                type="checkbox"
                checked={preferences.lineNumbers}
                onChange={(e) => updatePreferences({ lineNumbers: e.target.checked })}
              />
              Show Line Numbers
            </label>
            <label className="te-checkbox-label">
              <input
                type="checkbox"
                checked={preferences.indentWithSpaces}
                onChange={(e) => updatePreferences({ indentWithSpaces: e.target.checked })}
              />
              Indent With Spaces
            </label>
          </div>
        </div>

        <div className="te-modal-footer">
          <button className="te-btn te-btn-accent" onClick={() => setPreferencesOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
