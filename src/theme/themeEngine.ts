import type { ThemeConfig, UIDensity } from './tokens';
import { DENSITY_TOKENS } from './tokens';
import { THEME_PRESETS, PRESET_DARK, PRESET_LIGHT } from './themePresets';

export class ThemeEngine {
  private currentTheme: ThemeConfig = PRESET_DARK;

  getTheme(): ThemeConfig {
    return this.currentTheme;
  }

  applyTheme(theme: ThemeConfig, density?: UIDensity): void {
    this.currentTheme = theme;
    const activeDensity = density || theme.density;
    const root = document.documentElement;

    // Apply data-theme attribute
    root.setAttribute('data-theme', theme.mode);
    root.setAttribute('data-density', activeDensity);

    // Apply color variables
    const { colors, effects } = theme;
    root.style.setProperty('--os-color-brand', colors.brand);
    root.style.setProperty('--os-color-brand-hover', colors.brandHover);
    root.style.setProperty('--os-color-brand-glow', colors.brandGlow);
    root.style.setProperty('--os-color-accent', colors.accent);
    root.style.setProperty('--os-color-accent-hover', colors.accentHover);
    root.style.setProperty('--os-color-success', colors.success);
    root.style.setProperty('--os-color-warning', colors.warning);
    root.style.setProperty('--os-color-danger', colors.danger);
    root.style.setProperty('--os-color-danger-hover', colors.dangerHover);

    root.style.setProperty('--os-bg', colors.bg);
    root.style.setProperty('--os-surface-base', colors.surfaceBase);
    root.style.setProperty('--os-surface-elevated', colors.surfaceElevated);
    root.style.setProperty('--os-surface-hover', colors.surfaceHover);
    root.style.setProperty('--os-surface-active', colors.surfaceActive);
    root.style.setProperty('--os-surface-glass', colors.surfaceGlass);
    root.style.setProperty('--os-surface-glass-border', colors.surfaceGlassBorder);
    root.style.setProperty('--os-surface-solid', colors.surfaceSolid);

    root.style.setProperty('--os-text-primary', colors.textPrimary);
    root.style.setProperty('--os-text-secondary', colors.textSecondary);
    root.style.setProperty('--os-text-muted', colors.textMuted);
    root.style.setProperty('--os-text-inverse', colors.textInverse);

    root.style.setProperty('--os-border-subtle', colors.borderSubtle);
    root.style.setProperty('--os-border-default', colors.borderDefault);
    root.style.setProperty('--os-border-focus', colors.borderFocus);
    root.style.setProperty('--os-border-glass', colors.borderGlass);

    root.style.setProperty('--os-focus-ring', colors.focusRing);
    root.style.setProperty('--os-selection-bg', colors.selectionBg);
    root.style.setProperty('--os-selection-border', colors.selectionBorder);

    // Apply effects
    root.style.setProperty('--os-blur-subtle', effects.blurSubtle);
    root.style.setProperty('--os-blur-acrylic', effects.blurAcrylic);
    root.style.setProperty('--os-blur-heavy', effects.blurHeavy);
    root.style.setProperty('--os-shadow-sm', effects.shadowSm);
    root.style.setProperty('--os-shadow-md', effects.shadowMd);
    root.style.setProperty('--os-shadow-lg', effects.shadowLg);
    root.style.setProperty('--os-shadow-window', effects.shadowWindow);
    root.style.setProperty('--os-shadow-window-focused', effects.shadowWindowFocused);

    // Apply density metrics
    const dTokens = DENSITY_TOKENS[activeDensity];
    root.style.setProperty('--os-taskbar-height', `${dTokens.taskbarHeight}px`);
    root.style.setProperty('--os-space-unit', `${dTokens.spaceUnit}px`);
    root.style.setProperty('--os-icon-grid-size', `${dTokens.iconGridSize}px`);
    root.style.setProperty('--os-padding-scale', `${dTokens.paddingScale}`);
  }

  getSystemTheme(): ThemeConfig {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return PRESET_LIGHT;
    }
    return PRESET_DARK;
  }

  getPresetById(id: string): ThemeConfig | undefined {
    return THEME_PRESETS.find((p) => p.id === id);
  }
}

export const themeEngine = new ThemeEngine();
