import { useState } from 'react';
import { useShortcutStore } from '../../stores/shortcutStore';
import { Input } from '../../ui/Input/Input';
import { Toggle } from '../../ui/Toggle/Toggle';
import { AlertCircle, RotateCcw } from 'lucide-react';
import type { ShortcutCategory } from '../../keyboard/shortcutTypes';

const CATEGORIES: (ShortcutCategory | 'All')[] = [
  'All',
  'System',
  'Window Management',
  'Navigation',
  'Applications',
  'Accessibility',
];

export const ShortcutEditor = () => {
  const shortcuts = useShortcutStore((state) => state.shortcuts);
  const activeConflict = useShortcutStore((state) => state.activeConflict);
  const updateCombo = useShortcutStore((state) => state.updateCombo);
  const toggleEnabled = useShortcutStore((state) => state.toggleEnabled);
  const resetAll = useShortcutStore((state) => state.resetAll);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputCombo, setInputCombo] = useState('');

  const filtered = shortcuts.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()) ||
      s.currentCombo.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleSave = (id: string) => {
    if (!inputCombo.trim()) return;
    updateCombo(id, inputCombo.trim());
    setEditingId(null);
    setInputCombo('');
  };

  return (
    <div className="os-settings-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="os-settings-section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          Keyboard Shortcuts
        </h3>
        <button
          onClick={resetAll}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--os-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '12px',
          }}
        >
          <RotateCcw size={14} />
          Reset All Shortcuts
        </button>
      </div>

      {/* Conflict Warning Banner */}
      {activeConflict && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--os-color-danger)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--os-color-danger)',
            fontSize: '12px',
          }}
        >
          <AlertCircle size={18} />
          <div>
            <strong>Shortcut Conflict:</strong> '{activeConflict.conflictingCombo}' is already assigned to{' '}
            <em>{activeConflict.shortcutB.name}</em>.
          </div>
        </div>
      )}

      {/* Search & Categories */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Search shortcuts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--os-color-brand)' : 'var(--os-surface-hover)',
                color: selectedCategory === cat ? '#fff' : 'var(--os-text-secondary)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Shortcuts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((shortcut) => (
          <div key={shortcut.id} className="os-settings-row">
            <div className="os-settings-row-label" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="os-settings-row-title">{shortcut.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--os-text-muted)',
                  }}
                >
                  {shortcut.category}
                </span>
              </div>
              <span className="os-settings-row-sub">{shortcut.description}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {editingId === shortcut.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={inputCombo}
                    onChange={(e) => setInputCombo(e.target.value)}
                    style={{
                      background: 'var(--os-surface-solid)',
                      border: '1px solid var(--os-color-brand)',
                      color: 'var(--os-text-primary)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      width: 110,
                      textAlign: 'center',
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(shortcut.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleSave(shortcut.id)}
                    style={{
                      background: 'var(--os-color-brand)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <kbd
                  onClick={() => {
                    if (shortcut.isCustomizable) {
                      setEditingId(shortcut.id);
                      setInputCombo(shortcut.currentCombo);
                    }
                  }}
                  style={{
                    fontFamily: 'var(--os-font-mono, monospace)',
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--os-border-glass)',
                    borderRadius: '6px',
                    cursor: shortcut.isCustomizable ? 'pointer' : 'default',
                    color: shortcut.isEnabled ? 'var(--os-text-primary)' : 'var(--os-text-muted)',
                  }}
                  title={shortcut.isCustomizable ? 'Click to edit key combination' : 'System shortcut'}
                >
                  {shortcut.currentCombo}
                </kbd>
              )}

              <Toggle
                checked={shortcut.isEnabled}
                onChange={() => toggleEnabled(shortcut.id)}
                aria-label={`Enable ${shortcut.name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
