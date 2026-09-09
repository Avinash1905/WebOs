export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'system' | 'custom';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';

export interface ThemeColors {
  // Brand & Accents
  brand: string;
  brandHover: string;
  brandGlow: string;
  accent: string;
  accentHover: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  dangerHover: string;

  // Backgrounds & Surfaces
  bg: string;
  surfaceBase: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceGlass: string;
  surfaceGlassBorder: string;
  surfaceSolid: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Borders
  borderSubtle: string;
  borderDefault: string;
  borderFocus: string;
  borderGlass: string;

  // Focus & Selection
  focusRing: string;
  selectionBg: string;
  selectionBorder: string;
}

export interface ThemeDimensions {
  taskbarHeight: number;
  desktopIconSize: 'small' | 'medium' | 'large';
  radiusXs: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
}

export interface ThemeEffects {
  blurSubtle: string;
  blurAcrylic: string;
  blurHeavy: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowWindow: string;
  shadowWindowFocused: string;
  glassOpacity: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  density: UIDensity;
  effects: ThemeEffects;
  isHighContrast?: boolean;
}

export const DENSITY_TOKENS: Record<UIDensity, { spaceUnit: number; taskbarHeight: number; iconGridSize: number; paddingScale: number }> = {
  compact: {
    spaceUnit: 3,
    taskbarHeight: 40,
    iconGridSize: 80,
    paddingScale: 0.75,
  },
  comfortable: {
    spaceUnit: 4,
    taskbarHeight: 48,
    iconGridSize: 96,
    paddingScale: 1.0,
  },
  spacious: {
    spaceUnit: 6,
    taskbarHeight: 56,
    iconGridSize: 112,
    paddingScale: 1.25,
  },
};
