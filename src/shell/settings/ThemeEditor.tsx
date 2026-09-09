import { useThemeStore } from '../../stores/themeStore';
import { THEME_PRESETS } from '../../theme/themePresets';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';
import type { UIDensity } from '../../theme/tokens';

const ACCENT_COLORS = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#ec4899', // Rose Pink
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#f43f5e', // Red
];

export const ThemeEditor = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const activePresetId = useThemeStore((state) => state.activePresetId);
  const density = useThemeStore((state) => state.density);
  const setPreset = useThemeStore((state) => state.setPreset);
  const setDensity = useThemeStore((state) => state.setDensity);
  const setCustomAccentColor = useThemeStore((state) => state.setCustomAccentColor);
  const resetToDefaults = useThemeStore((state) => state.resetToDefaults);

  return (
    <div className="os-settings-section">
      <h3 className="os-settings-section-title">Theme & Appearance</h3>

      {/* Theme Presets */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Color Theme Preset</span>
          <span className="os-settings-row-sub">Choose a curated visual style for the entire desktop shell</span>
        </div>
        <select
          value={activePresetId}
          onChange={(e) => setPreset(e.target.value)}
          style={{
            background: 'var(--os-surface-hover)',
            border: '1px solid var(--os-border-glass)',
            color: 'var(--os-text-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
          }}
          aria-label="Theme Preset"
        >
          {THEME_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Accent Colors */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Accent Color</span>
          <span className="os-settings-row-sub">Buttons, sliders, active badges, and focus indicators</span>
        </div>
        <div className="os-color-swatches">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              className={`os-color-swatch ${currentTheme.colors.brand === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCustomAccentColor(color)}
              aria-label={`Select accent color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* UI Density */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">UI Density</span>
          <span className="os-settings-row-sub">Scales taskbar height, desktop icon spacing, and element padding</span>
        </div>
        <SegmentedControl
          value={density}
          onChange={(val) => setDensity(val as UIDensity)}
          options={[
            { id: 'compact', label: 'Compact' },
            { id: 'comfortable', label: 'Comfortable' },
            { id: 'spacious', label: 'Spacious' },
          ]}
        />
      </div>

      {/* Reset Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={resetToDefaults}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--os-border-glass)',
            color: 'var(--os-text-primary)',
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          Reset to Factory Defaults
        </button>
      </div>
    </div>
  );
};
