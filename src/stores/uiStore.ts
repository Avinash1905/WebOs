import { create } from 'zustand';
import type { ThemeMode, UIPreferences } from '../types/theme';
import { DEFAULT_WALLPAPER, WALLPAPERS, type WallpaperConfig } from '../theme/wallpapers';

interface UIStore extends UIPreferences {
  currentWallpaper: WallpaperConfig;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setWallpaper: (wallpaperId: string) => void;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
  setDockPosition: (pos: 'bottom' | 'top') => void;
  setDesktopIconSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'dark',
  accentColor: '#3b82f6',
  wallpaperId: DEFAULT_WALLPAPER.id,
  currentWallpaper: DEFAULT_WALLPAPER,
  soundEnabled: true,
  reducedMotion: false,
  dockPosition: 'bottom',
  desktopIconSize: 'medium',

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setAccentColor: (color) => {
    document.documentElement.style.setProperty('--os-color-brand', color);
    set({ accentColor: color });
  },

  setWallpaper: (wallpaperId) => {
    const found = WALLPAPERS.find((w) => w.id === wallpaperId) || DEFAULT_WALLPAPER;
    set({ wallpaperId: found.id, currentWallpaper: found });
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),

  setDockPosition: (pos) => set({ dockPosition: pos }),

  setDesktopIconSize: (size) => set({ desktopIconSize: size }),
}));
