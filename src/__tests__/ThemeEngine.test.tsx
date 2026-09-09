import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../stores/themeStore';
import { themeEngine } from '../theme/themeEngine';
import { PRESET_LIGHT, PRESET_HIGH_CONTRAST, PRESET_CYBERPUNK } from '../theme/themePresets';

describe('Theme Engine & Token System', () => {
  beforeEach(() => {
    useThemeStore.getState().resetToDefaults();
  });

  it('switches between presets and updates DOM attributes', () => {
    useThemeStore.getState().setPreset(PRESET_LIGHT.id);
    expect(useThemeStore.getState().currentTheme.mode).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    useThemeStore.getState().setPreset(PRESET_CYBERPUNK.id);
    expect(useThemeStore.getState().currentTheme.id).toBe('preset-cyberpunk');
  });

  it('activates High Contrast Mode with WCAG AAA tokens', () => {
    useThemeStore.getState().setPreset(PRESET_HIGH_CONTRAST.id);
    const theme = useThemeStore.getState().currentTheme;

    expect(theme.isHighContrast).toBe(true);
    expect(theme.effects.blurAcrylic).toBe('none');
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    expect(theme.colors.textPrimary).toBe('#ffffff');
    expect(theme.colors.bg).toBe('#000000');
  });

  it('updates UI density tokens across compact, comfortable, and spacious', () => {
    useThemeStore.getState().setDensity('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    expect(useThemeStore.getState().density).toBe('compact');

    useThemeStore.getState().setDensity('spacious');
    expect(document.documentElement.getAttribute('data-density')).toBe('spacious');
    expect(useThemeStore.getState().density).toBe('spacious');
  });

  it('supports custom accent color generation and updates variables', () => {
    useThemeStore.getState().setCustomAccentColor('#ec4899');
    expect(useThemeStore.getState().currentTheme.colors.brand).toBe('#ec4899');
  });

  it('resolves system theme based on prefers-color-scheme', () => {
    const sysTheme = themeEngine.getSystemTheme();
    expect(sysTheme).toBeDefined();
    expect(['dark', 'light']).toContain(sysTheme.mode);
  });
});
