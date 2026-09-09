import { useThemeStore } from '../../stores/themeStore';
import { Toggle } from '../../ui/Toggle/Toggle';

export const A11ySettings = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const reducedMotion = useThemeStore((state) => state.reducedMotion);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleReducedMotion = useThemeStore((state) => state.toggleReducedMotion);

  const isHighContrast = currentTheme.mode === 'high-contrast';

  return (
    <div className="os-settings-section">
      <h3 className="os-settings-section-title">Accessibility & Vision</h3>

      {/* High Contrast Mode */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">High Contrast Mode (WCAG AAA)</span>
          <span className="os-settings-row-sub">Maximizes color contrast, bright outlines, and removes transparencies</span>
        </div>
        <Toggle
          checked={isHighContrast}
          onChange={() => setThemeMode(isHighContrast ? 'dark' : 'high-contrast')}
          aria-label="High Contrast Mode"
        />
      </div>

      {/* Reduced Motion */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Reduce Motion & Transition Animations</span>
          <span className="os-settings-row-sub">Minimizes window scaling, slides, and non-essential movement across WebOS</span>
        </div>
        <Toggle
          checked={reducedMotion}
          onChange={toggleReducedMotion}
          aria-label="Reduce Motion"
        />
      </div>

      {/* Screen Reader Guidance Info */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid var(--os-border-glass)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          lineHeight: '1.5',
          color: 'var(--os-text-secondary)',
        }}
      >
        <strong style={{ color: 'var(--os-text-primary)', display: 'block', marginBottom: 4 }}>
          Screen-Reader & Keyboard Accessibility
        </strong>
        WebOS provides integrated ARIA live announcements, focus containment for active dialogs, and comprehensive keyboard shortcuts. Press <strong>Alt + Shift + H</strong> at any time to instantly toggle High Contrast mode.
      </div>
    </div>
  );
};
