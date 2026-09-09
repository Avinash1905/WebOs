import { create } from 'zustand';
import type { ThemeConfig, UIDensity, ThemeMode } from '../theme/tokens';
import { THEME_PRESETS, PRESET_DARK, PRESET_HIGH_CONTRAST } from '../theme/themePresets';
import { themeEngine } from '../theme/themeEngine';
import { DEFAULT_WALLPAPER, WALLPAPERS, type WallpaperConfig, type WallpaperFitMode } from '../theme/wallpapers';

const STORAGE_KEY = 'webos_theme_preferences';

interface PersistedThemeData {
  presetId?: string;
  mode?: ThemeMode;
  density?: UIDensity;
  customAccentColor?: string;
  wallpaperId?: string;
  wallpaperFit?: WallpaperFitMode;
  wallpaperBlur?: number;
  reducedMotion?: boolean;
}

const loadSavedTheme = (): PersistedThemeData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const saveTheme = (data: PersistedThemeData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const saved = loadSavedTheme();
const initialPreset = THEME_PRESETS.find((p) => p.id === saved.presetId) || PRESET_DARK;
const initialWallpaper = WALLPAPERS.find((w) => w.id === saved.wallpaperId) || DEFAULT_WALLPAPER;

interface ThemeStoreState {
  currentTheme: ThemeConfig;
  activePresetId: string;
  density: UIDensity;
  customAccentColor: string | null;
  wallpaper: WallpaperConfig;
  wallpaperFit: WallpaperFitMode;
  wallpaperBlur: number;
  reducedMotion: boolean;

  setPreset: (presetId: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDensity: (density: UIDensity) => void;
  setCustomAccentColor: (color: string) => void;
  setWallpaper: (wallpaperId: string) => void;
  setCustomWallpaper: (wallpaper: WallpaperConfig) => void;
  setWallpaperFit: (fit: WallpaperFitMode) => void;
  setWallpaperBlur: (blur: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  toggleReducedMotion: () => void;
  resetToDefaults: () => void;
}

export const useThemeStore = create<ThemeStoreState>((set, get) => {
  // Initial apply
  themeEngine.applyTheme(initialPreset, saved.density || 'comfortable');

  return {
    currentTheme: initialPreset,
    activePresetId: initialPreset.id,
    density: saved.density || 'comfortable',
    customAccentColor: saved.customAccentColor || null,
    wallpaper: initialWallpaper,
    wallpaperFit: saved.wallpaperFit || 'cover',
    wallpaperBlur: saved.wallpaperBlur || 0,
    reducedMotion: saved.reducedMotion || false,

    setPreset: (presetId) => {
      const preset = THEME_PRESETS.find((p) => p.id === presetId) || PRESET_DARK;
      themeEngine.applyTheme(preset, get().density);
      set({ currentTheme: preset, activePresetId: preset.id });
      saveTheme({
        presetId: preset.id,
        mode: preset.mode,
        density: get().density,
        wallpaperId: get().wallpaper.id,
        reducedMotion: get().reducedMotion,
      });
    },

    setThemeMode: (mode) => {
      if (mode === 'high-contrast') {
        get().setPreset(PRESET_HIGH_CONTRAST.id);
        return;
      }
      if (mode === 'system') {
        const sysTheme = themeEngine.getSystemTheme();
        themeEngine.applyTheme(sysTheme, get().density);
        set({ currentTheme: sysTheme, activePresetId: sysTheme.id });
        return;
      }
      const targetPreset = THEME_PRESETS.find((p) => p.mode === mode) || PRESET_DARK;
      get().setPreset(targetPreset.id);
    },

    setDensity: (density) => {
      themeEngine.applyTheme(get().currentTheme, density);
      set({ density });
      saveTheme({
        presetId: get().activePresetId,
        density,
        wallpaperId: get().wallpaper.id,
        reducedMotion: get().reducedMotion,
      });
    },

    setCustomAccentColor: (color) => {
      const updatedColors = {
        ...get().currentTheme.colors,
        brand: color,
        brandHover: color,
        brandGlow: `${color}66`,
      };
      const customTheme: ThemeConfig = {
        ...get().currentTheme,
        id: 'custom-theme',
        name: 'Custom Theme',
        colors: updatedColors,
      };
      themeEngine.applyTheme(customTheme, get().density);
      set({ currentTheme: customTheme, customAccentColor: color });
      saveTheme({
        presetId: get().activePresetId,
        customAccentColor: color,
        density: get().density,
        wallpaperId: get().wallpaper.id,
      });
    },

    setWallpaper: (wallpaperId) => {
      const found = WALLPAPERS.find((w) => w.id === wallpaperId) || DEFAULT_WALLPAPER;
      set({ wallpaper: found });
      saveTheme({
        presetId: get().activePresetId,
        density: get().density,
        wallpaperId: found.id,
      });
    },

    setCustomWallpaper: (wallpaper) => {
      set({ wallpaper });
    },

    setWallpaperFit: (fit) => {
      set({ wallpaperFit: fit });
      saveTheme({
        presetId: get().activePresetId,
        density: get().density,
        wallpaperId: get().wallpaper.id,
        wallpaperFit: fit,
      });
    },

    setWallpaperBlur: (blur) => {
      set({ wallpaperBlur: blur });
      saveTheme({
        presetId: get().activePresetId,
        density: get().density,
        wallpaperId: get().wallpaper.id,
        wallpaperBlur: blur,
      });
    },

    setReducedMotion: (reducedMotion) => {
      document.documentElement.setAttribute('data-reduced-motion', reducedMotion ? 'true' : 'false');
      set({ reducedMotion });
      saveTheme({
        presetId: get().activePresetId,
        density: get().density,
        wallpaperId: get().wallpaper.id,
        reducedMotion,
      });
    },

    toggleReducedMotion: () => {
      const next = !get().reducedMotion;
      get().setReducedMotion(next);
    },

    resetToDefaults: () => {
      get().setPreset(PRESET_DARK.id);
      get().setDensity('comfortable');
      get().setWallpaper(DEFAULT_WALLPAPER.id);
      get().setReducedMotion(false);
      get().setWallpaperFit('cover');
      get().setWallpaperBlur(0);
    },
  };
});
